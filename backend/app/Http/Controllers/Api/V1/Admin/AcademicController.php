<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Controller;
use App\Http\Resources\{StructureResource, UserResource, CourseResource};
use App\Models\{Faculty, Department, AcademicYear, Semester, Course, CourseOffering, User, GradeEntry, Lecture, Assignment, Announcement};
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class AcademicController extends Controller
{
    public function catalog() {
        $data = [];
        foreach (['faculties' => Faculty::class, 'departments' => Department::class, 'academic_years' => AcademicYear::class, 'semesters' => Semester::class, 'courses' => Course::class] as $key => $class) $data[$key] = StructureResource::collection($class::orderBy('id')->get());
        foreach (['teachers' => 'teacher', 'students' => 'student'] as $key => $role) $data[$key] = UserResource::collection(User::where('role', $role)->with('permissions')->get());
        $data['offerings'] = CourseResource::collection(CourseOffering::with(['course', 'teacher', 'semester', 'schedule'])->withCount('enrollments')->get());
        return ApiResponse::data($data);
    }
    public function activity(Request $r) {
        $rows = User::where('role', 'teacher')->with(['offerings.enrollments', 'offerings.components.entries', 'offerings.lectures', 'offerings.assignments', 'offerings.announcements'])->get()->map(function ($t) {
            $os = $t->offerings; $grades = $os->flatMap(fn ($o) => $o->components->flatMap->entries); $materials = $os->flatMap->lectures;
            $dates = $materials->pluck('updated_at')->merge($grades->pluck('updated_at'))->merge($os->flatMap->announcements->where('author_id', $t->id)->pluck('created_at'))->filter()->sort();
            return ['id' => $t->id, 'name' => $t->name, 'courses' => $os->count(), 'students' => $os->flatMap->enrollments->pluck('student_id')->unique()->count(), 'assignments' => $os->sum(fn ($o) => $o->assignments->count()), 'materials' => $materials->count(), 'graded' => $grades->count(), 'last_activity' => $dates->last()?->toIso8601String()];
        });
        return ApiResponse::page((new ListQuery($r))->collection($rows, ['name', 'courses', 'assignments', 'materials', 'graded', 'last_activity'], 'name'), fn ($row) => $row);
    }
}
