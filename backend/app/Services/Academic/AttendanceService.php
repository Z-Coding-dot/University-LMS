<?php
namespace App\Services\Academic;
use App\Models\{CourseOffering, AcademicSetting};
use App\Support\AcademicValidation as V;
use Illuminate\Support\Facades\DB;
class AttendanceService
{
    public function percent(iterable $statuses, array $counted, int $denominator): ?float
    {
        return $denominator ? collect($statuses)->filter(fn ($s) => in_array($s instanceof \BackedEnum ? $s->value : $s, $counted, true))->count() / $denominator * 100 : null;
    }
    public function forOffering(CourseOffering $o, ?int $student = null): ?float
    {
        $sessions = $o->attendanceSessions->filter(fn ($s) => $s->date->toDateString() <= app(SemesterService::class)->today()->toDateString());
        $records = $sessions->flatMap->records->filter(fn ($r) => $student === null || $r->student_id === $student);
        return $this->percent($records->pluck('status'), AcademicSetting::findOrFail(1)->attendance_counted_statuses, $sessions->count() * ($student === null ? $o->enrollments()->count() : 1));
    }
    public function save(CourseOffering $offering, array $data) {
        return DB::transaction(function () use ($offering, $data) {
            $o = CourseOffering::whereKey($offering->id)->lockForUpdate()->firstOrFail();
            V::check($data['date'] <= app(SemesterService::class)->today()->toDateString(), 'date');
            $ids = $o->enrollments()->pluck('student_id')->all();
            foreach ($data['records'] as $row) V::check(in_array((int) $row['student_id'], $ids, true), 'records');
            $s = $o->attendanceSessions()->firstOrCreate(['date' => $data['date']]);
            foreach ($data['records'] as $row) $s->records()->updateOrCreate(['student_id' => $row['student_id']], ['status' => $row['status']]);
            return $s;
        });
    }
}
