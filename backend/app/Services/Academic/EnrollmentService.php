<?php
namespace App\Services\Academic;
use App\Models\{CourseOffering, Enrollment, User};
use App\Support\AcademicValidation as V;
use Illuminate\Support\Facades\DB;
class EnrollmentService
{
    public function add(CourseOffering $offering, array $data): CourseOffering
    {
        return DB::transaction(function () use ($offering, $data) {
            $o = app(ScheduleConflictService::class)->lock($offering);
            $users = User::whereIn('id', $data['student_ids'])->orderBy('id')->lockForUpdate()->get();
            V::check($users->count() === count($data['student_ids']) && $users->every(fn ($u) => $u->role->value === 'student' && $u->status->value === 'active'), 'student_ids');
            $ids = $o->enrollments()->pluck('student_id')->merge($data['student_ids'])->unique()->values()->all();
            V::check(count($ids) <= $o->capacity, 'student_ids', 'capacity_exceeded');
            app(ScheduleConflictService::class)->validate($o, $o->schedule->toArray(), $ids);
            foreach ($users as $user) {
                Enrollment::firstOrCreate(['offering_id' => $o->id, 'student_id' => $user->id]);
                if ($data['make_current']) $user->update(['current_semester_id' => $o->semester_id, 'department_id' => $user->department_id ?? $o->course->department_id]);
            }
            return $o->fresh();
        });
    }
}
