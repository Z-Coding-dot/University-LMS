<?php
namespace App\Services\Content;
use App\Models\{User, Lecture, Assignment, Submission, Announcement};
use App\Enums\{Permission, Role};
use App\Services\Academic\{OfferingAccess, SemesterService};
use App\Services\Files\UploadService;
use App\Support\AcademicValidation as V;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
class ContentService
{
    public function teaching(User $u, array $d, string $kind, ?int $id = null, ?int $pathOffering = null) {
        V::check($pathOffering === null || $d['offering_id'] == $pathOffering, 'offering_id');
        if ($id !== null) { $class = $kind === 'lecture' ? Lecture::class : Assignment::class; V::check($class::findOrFail($id)->offering_id == $d['offering_id'], 'offering_id'); }
        app(OfferingAccess::class)->find($u, $d['offering_id'], $kind === 'lecture' ? Permission::ManageMaterials : Permission::ManageAssignments);
        return DB::transaction(function () use ($u, $d, $kind, $id, $pathOffering) {
            $class = $kind === 'lecture' ? Lecture::class : Assignment::class;
            $row = $id ? $class::whereKey($id)->lockForUpdate()->firstOrFail() : new $class;
            V::check(($pathOffering === null || $d['offering_id'] == $pathOffering) && (!$id || $row->offering_id == $d['offering_id']), 'offering_id');
            $ids = app(UploadService::class)->attachments($u, (int) $d['offering_id'], $kind, $d['attachment_ids'], $id ? $row->attachments()->pluck('uploads.id')->all() : []);
            $d['description'] = trim($d['description'] ?? ''); V::check($d['description'] !== '' || count($ids) > 0, 'description'); unset($d['attachment_ids']);
            if ($kind === 'assignment') { V::check($d['due_date'] >= app(SemesterService::class)->today()->toDateString(), 'due_date'); $d['due_at'] = CarbonImmutable::parse($d['due_date'].' 23:59:59', config('lms.timezone'))->utc(); unset($d['due_date']); }
            $row->fill($d + ['translations' => null])->save(); $row->attachments()->sync($ids); return $row->fresh();
        });
    }
    public function submit(User $u, int $id, array $ids) {
        $assignment = Assignment::findOrFail($id); app(OfferingAccess::class)->find($u, $assignment->offering_id);
        return DB::transaction(function () use ($u, $id, $ids) {
            $a = Assignment::whereKey($id)->lockForUpdate()->firstOrFail();
            $s = Submission::where('assignment_id', $id)->where('student_id', $u->id)->lockForUpdate()->first(); abort_if($s && $s->score !== null, 403);
            V::check($a->submission_enabled && $a->due_at->gte(now()), 'file_ids', 'submission_closed');
            $files = app(UploadService::class)->attachments($u, $a->offering_id, 'submission', $ids, $s ? $s->files()->pluck('uploads.id')->all() : []);
            $s ??= new Submission(['assignment_id' => $id, 'student_id' => $u->id]); $s->fill(['submitted_at' => now(), 'score' => null, 'feedback' => null])->save(); $s->files()->sync($files); return $s->fresh();
        });
    }
    public function grade(int $id, array $d) {
        $submission = Submission::findOrFail($id);
        return DB::transaction(function () use ($submission, $id, $d) { Assignment::whereKey($submission->assignment_id)->lockForUpdate()->firstOrFail(); $s = Submission::whereKey($id)->lockForUpdate()->firstOrFail(); $s->update($d + ['translations' => null]); return $s; });
    }
    public function announcement(User $u, array $d, ?int $id) {
        abort_if($u->role === Role::Teacher && $d['audience'] !== 'offering', 403);
        V::check(empty($d['week_number']) || $d['audience'] === 'offering', 'week_number');
        if ($d['audience'] === 'offering') app(OfferingAccess::class)->find($u, (int) $d['offering_id'], Permission::PostAnnouncements);
        return DB::transaction(function () use ($u, $d, $id) {
            $a = $id ? Announcement::whereKey($id)->lockForUpdate()->firstOrFail() : new Announcement(['author_id' => $u->id]);
            if ($id) { abort_if($u->role !== Role::Admin && $a->author_id !== $u->id, 403); if ($a->offering_id) app(OfferingAccess::class)->find($u, $a->offering_id, Permission::PostAnnouncements); }
            $d['role'] = $d['audience'] === 'role' ? $d['role'] : null; $d['offering_id'] = $d['audience'] === 'offering' ? $d['offering_id'] : null; $d['week_number'] ??= null;
            $a->fill($d + ['translations' => null])->save(); return $a;
        });
    }
}
