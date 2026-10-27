<?php
namespace App\Services\Files;
use App\Enums\{Role, Permission};
use App\Models\{User, Upload};
use App\Services\Academic\OfferingAccess;
use App\Support\AcademicValidation as V;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{DB, Storage};
class UploadService
{
    public function authorize(User $u, int $offering, string $purpose): void {
        $permission = match ($purpose) { 'lecture' => Permission::ManageMaterials, 'assignment' => Permission::ManageAssignments, 'submission' => null, default => abort(403) };
        abort_unless($purpose === 'submission' ? $u->role === Role::Student : $u->role !== Role::Student, 403);
        app(OfferingAccess::class)->find($u, $offering, $permission);
    }
    public function verify(UploadedFile $file): string {
        $ext = strtolower($file->getClientOriginalExtension()); $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file->getRealPath());
        $office = ['docx' => 'word/', 'pptx' => 'ppt/', 'xlsx' => 'xl/'];
        $types = ['pdf' => ['application/pdf'], 'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'], 'zip' => ['application/zip', 'application/x-zip-compressed'], 'doc' => ['application/msword', 'application/CDFV2', 'application/x-ole-storage'], 'ppt' => ['application/vnd.ms-powerpoint', 'application/CDFV2', 'application/x-ole-storage'], 'xls' => ['application/vnd.ms-excel', 'application/CDFV2', 'application/x-ole-storage']];
        foreach (['docx' => 'wordprocessingml.document', 'pptx' => 'presentationml.presentation', 'xlsx' => 'spreadsheetml.sheet'] as $e => $suffix) $types[$e] = ['application/vnd.openxmlformats-officedocument.'.$suffix, 'application/zip'];
        V::check($file->isValid() && $file->getSize() > 0 && $file->getSize() <= config('lms.uploads.max_bytes') && in_array($ext, config('lms.uploads.extensions'), true) && in_array($mime, $types[$ext] ?? [], true), 'files', 'invalid_files');
        if (isset($office[$ext])) {
            // Read the ZIP central directory without extracting/decompressing any entry.
            $bytes = file_get_contents($file->getRealPath());
            V::check(str_starts_with($bytes, "PK\x03\x04") && str_contains($bytes, '[Content_Types].xml') && str_contains($bytes, $office[$ext]), 'files', 'invalid_files');
        }
        return $mime;
    }
    public function store(User $u, int $offering, string $purpose, array $files) {
        $this->authorize($u, $offering, $purpose); $paths = [];
        foreach ($files as $f) $this->verify($f);
        try { return DB::transaction(function () use ($u, $offering, $purpose, $files, &$paths) {
            return collect($files)->map(function ($f) use ($u, $offering, $purpose, &$paths) {
                $path = $f->storeAs('uploads', bin2hex(random_bytes(24)).'.'.strtolower($f->getClientOriginalExtension()), 'local');
                if (!$path) throw new \RuntimeException('Private storage write failed'); $paths[] = $path;
                $name = preg_replace('/[\x00-\x1F\x7F]/u', '', basename(str_replace('\\', '/', $f->getClientOriginalName())));
                return Upload::create(['uploader_id' => $u->id, 'offering_id' => $offering, 'purpose' => $purpose, 'path' => $path, 'original_name' => mb_substr($name, 0, 255), 'size' => $f->getSize(), 'mime_type' => $this->verify($f)]);
            });
        }); } catch (\Throwable $e) { Storage::disk('local')->delete($paths); throw $e; }
    }
    public function attachments(User $u, int $offering, string $purpose, array $ids, array $retained = []): array {
        V::check(count($ids) <= 5 && count(array_unique($ids)) === count($ids), 'attachment_ids', 'invalid_files');
        $files = Upload::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get(); V::check($files->count() === count($ids), 'attachment_ids', 'invalid_files');
        foreach ($files as $f) {
            V::check($f->offering_id === $offering && $f->purpose->value === $purpose && (in_array($f->id, $retained, true) || $f->uploader_id === $u->id) && $f->size > 0 && $f->size <= config('lms.uploads.max_bytes') && Storage::disk('local')->exists($f->path), 'attachment_ids', 'invalid_files');
            V::check(Storage::disk('local')->size($f->path) === $f->size, 'attachment_ids', 'invalid_files');
            $this->verify(new UploadedFile(Storage::disk('local')->path($f->path), $f->original_name, $f->mime_type, null, true));
        }
        return $ids;
    }
    public function download(User $u, Upload $file): void {
        if ($file->uploader_id === $u->id) return;
        $attached = $file->lectures()->exists() || $file->assignments()->exists() || $file->submissions()->exists(); abort_unless($attached, 403);
        app(OfferingAccess::class)->find($u, $file->offering_id);
        if ($file->purpose->value === 'submission') {
            if ($u->role === Role::Student) abort_unless($file->submissions()->where('student_id', $u->id)->exists(), 403);
            else abort_unless($u->hasPermission(Permission::ManageAssignments), 403);
        }
    }
}
