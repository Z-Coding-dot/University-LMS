<?php
namespace App\Services\Academic;
use App\Enums\{Role, GradeStatus};
use App\Models\{User, CourseOffering, AcademicSetting};
use App\Http\Resources\{CourseResource, AcademicResource, SettingsResource};
use Illuminate\Http\Request;
class CourseService
{
    public function scope(User $user, ?int $semester = null) { $semester ??= app(SemesterService::class)->forUser($user)?->id; return app(OfferingAccess::class)->scoped($user)->where('semester_id', $semester)->with(['course', 'semester', 'teacher', 'schedule', 'enrollments']); }
    public function detail(CourseOffering $o, Request $r): array {
        $student = $r->user()->role === Role::Student; $sessions = $o->attendanceSessions()->with('records')->orderByDesc('date')->get();
        return (new CourseResource($o))->resolve($r) + ['components' => AcademicResource::collection($o->components), 'grades' => AcademicResource::collection($student && $o->grade_status !== GradeStatus::Draft ? $o->components->flatMap(fn ($c) => $c->entries->where('student_id', $r->user()->id)) : collect()),
            'attendance_sessions' => AcademicResource::collection($sessions), 'attendance_records' => AcademicResource::collection($sessions->flatMap->records->filter(fn ($rec) => !$student || $rec->student_id === $r->user()->id)), 'attendance_percent' => app(AttendanceService::class)->forOffering($o, $student ? $r->user()->id : null), 'settings' => new SettingsResource(AcademicSetting::findOrFail(1))];
    }
    public function result(CourseOffering $o, int $student): array {
        $grading = app(GradingService::class); $total = $grading->studentTotal($o, $student);
        return ['id' => $o->id, 'code' => $o->course->code, 'name' => ['fa' => $o->course->name_fa, 'en' => $o->course->name_en], 'credits' => $o->course->credits, 'total' => $total, 'letter' => $grading->letter($total), 'status' => $o->grade_status->value,
            'assessments' => $o->components->map(function ($c) use ($o, $student) { $e = $o->grade_status === GradeStatus::Draft ? null : $c->entries->firstWhere('student_id', $student); return (new AcademicResource($c))->resolve() + ['score' => $e?->score, 'feedback' => $e?->feedback]; }),
            'assignments' => $o->assignments->map(function ($a) use ($student) { $s = $a->submissions->firstWhere('student_id', $student); return ['id' => $a->id, 'title' => $a->title, 'week_number' => $a->week_number, 'submitted' => $s !== null, 'score' => $s?->score, 'feedback' => $s?->feedback]; })];
    }
    public function breakdown(CourseOffering $o, int $student) {
        $result = $this->result($o, $student);
        return $result['assessments']->map(fn ($c) => ['kind' => 'component', 'source_id' => $c['id'], 'title' => $c['name'][app()->getLocale()], 'week_number' => null, 'score' => $c['score'], 'max_score' => $c['max_score'], 'weight' => $c['weight'], 'feedback' => $c['feedback'], 'status' => $c['score'] === null ? 'draft' : $o->grade_status->value])->concat($result['assignments']->map(fn ($a) => ['kind' => 'assignment', 'source_id' => $a['id'], 'title' => $a['title'], 'week_number' => $a['week_number'], 'score' => $a['score'], 'max_score' => 100, 'weight' => null, 'feedback' => $a['feedback'], 'status' => $a['score'] !== null ? 'graded' : ($a['submitted'] ? 'submitted' : 'not_submitted')]));
    }
}
