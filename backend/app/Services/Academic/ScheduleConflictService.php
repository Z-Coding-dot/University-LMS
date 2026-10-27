<?php
namespace App\Services\Academic;
use App\Models\{CourseOffering, Semester};
use App\Support\AcademicValidation as V;

class ScheduleConflictService
{
    // Every schedule/enrollment/instructor mutation locks the semester first, serializing cross-offering checks.
    public function lock(CourseOffering $o): CourseOffering
    {
        Semester::whereKey($o->semester_id)->lockForUpdate()->firstOrFail();
        return CourseOffering::whereKey($o->id)->lockForUpdate()->firstOrFail();
    }
    public function overlaps($a, $b): bool { return (int) $a['weekday'] === (int) $b['weekday'] && substr($a['start'], 0, 5) < substr($b['end'], 0, 5) && substr($b['start'], 0, 5) < substr($a['end'], 0, 5); }
    public function validate(CourseOffering $o, array $slots, ?array $students = null): void
    {
        $students ??= $o->enrollments()->pluck('student_id')->all();
        foreach ($slots as $i => $slot) foreach (array_slice($slots, $i + 1) as $next) V::check(!$this->overlaps($slot, $next), 'slots', 'schedule_conflict');
        $others = CourseOffering::where('semester_id', $o->semester_id)->where('id', '!=', $o->id)->with(['schedule', 'enrollments'])->get();
        foreach ($others as $other) foreach ($other->schedule as $existing) foreach ($slots as $slot) {
            if (!$this->overlaps($existing->toArray(), $slot)) continue;
            $conflict = $other->teacher_id === $o->teacher_id || mb_strtolower($existing->room) === mb_strtolower($slot['room']) || count(array_intersect($students, $other->enrollments->pluck('student_id')->all())) > 0;
            V::check(!$conflict, 'slots', 'schedule_conflict');
        }
    }
}
