<?php
namespace App\Services\Academic;
use App\Models\{AcademicYear, Course, Department, Faculty, Semester};
use App\Support\AcademicValidation as V;
use Illuminate\Support\Facades\DB;
class StructureService
{
    public function model(string $resource): string { return match ($resource) { 'faculties' => Faculty::class, 'departments' => Department::class, 'academic-years' => AcademicYear::class, 'semesters' => Semester::class, 'courses' => Course::class, default => abort(404) }; }
    public function save(string $resource, ?int $id, array $data)
    {
        return DB::transaction(function () use ($resource, $id, $data) {
            $class = $this->model($resource);
            if ($resource === 'semesters') {
                $year = AcademicYear::whereKey($data['academic_year_id'])->lockForUpdate()->firstOrFail();
                V::check($data['starts_at'] >= $year->starts_at->toDateString() && $data['ends_at'] <= $year->ends_at->toDateString(), 'ends_at');
            }
            $row = $id ? $class::whereKey($id)->lockForUpdate()->firstOrFail() : new $class;
            if ($resource === 'academic-years' && $id) V::check(!Semester::where('academic_year_id', $id)->where(fn ($q) => $q->where('starts_at', '<', $data['starts_at'])->orWhere('ends_at', '>', $data['ends_at']))->exists(), 'ends_at');
            if ($resource === 'courses') V::check(!Course::whereRaw('LOWER(code) = ?', [mb_strtolower($data['code'])])->when($id, fn ($q) => $q->where('id', '!=', $id))->exists(), 'code');
            $row->fill(V::attributes($data))->save(); return $row;
        });
    }
    public function delete(string $resource, int $id): void
    {
        // Database RESTRICT constraints are authoritative, including concurrent references.
        DB::transaction(fn () => $this->model($resource)::whereKey($id)->lockForUpdate()->firstOrFail()->delete());
    }
}
