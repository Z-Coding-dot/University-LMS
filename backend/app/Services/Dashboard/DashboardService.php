<?php
namespace App\Services\Dashboard;

use App\Enums\{Role, GradeStatus, Permission};
use App\Models\{User, AcademicSetting};
use App\Http\Resources\{AcademicResource, StructureResource};
use App\Services\Academic\{CourseService, GradingService, AttendanceService, SemesterService};
use App\Services\Content\AnnouncementService;
use App\Support\Digits;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardService
{
    private function name($model): array { return ['fa' => $model->name_fa, 'en' => $model->name_en]; }
    private function canGrades(User $u): bool { return $u->hasPermission(Permission::EnterGrades) || $u->hasPermission(Permission::PublishGrades); }
    private function attendance(Collection $offerings, User $u, ?string $date = null): ?float {
        $day = app(SemesterService::class)->today()->toDateString(); $statuses = collect(); $denominator = 0;
        foreach ($offerings as $o) {
            $sessions = $o->attendanceSessions->filter(fn ($s) => $s->date->toDateString() <= $day && ($date === null || $s->date->toDateString() === $date));
            $denominator += $sessions->count() * ($u->role === Role::Student ? 1 : $o->enrollments->count());
            $statuses = $statuses->concat($sessions->flatMap->records->filter(fn ($rec) => $u->role !== Role::Student || $rec->student_id === $u->id)->pluck('status'));
        }
        return app(AttendanceService::class)->percent($statuses, AcademicSetting::findOrFail(1)->attendance_counted_statuses, $denominator);
    }
    public function build(Request $r): array {
        $u = $r->user(); $semesters = app(SemesterService::class); $grading = app(GradingService::class); $today = $semesters->today(); $day = $today->toDateString(); $student = $u->role === Role::Student;
        $semester = $semesters->forUser($u);
        $scope = app(CourseService::class)->scope($u)->with(['attendanceSessions.records', 'components.entries.student', 'assignments.submissions.student', 'assignments.attachments', 'lectures.attachments'])->get();
        if ($r->filled('offering_id')) abort_unless($scope->contains('id', $r->integer('offering_id')), 403);
        $selected = $r->filled('offering_id') ? $scope->where('id', $r->integer('offering_id')) : $scope;
        $search = mb_strtolower(trim(Digits::normalize((string) $r->query('search', ''))));
        $matches = fn (...$values) => $search === '' || collect($values)->contains(fn ($v) => str_contains(mb_strtolower((string) $v), $search));
        $courseMatches = $selected->filter(fn ($o) => $matches($o->course->code, $o->course->{'name_'.app()->getLocale()}));
        $tasks = collect(); $files = collect(); $work = collect(); $submissions = collect(); $grades = collect(); $classes = collect();
        foreach ($selected as $o) {
            $name = $this->name($o->course); $roster = $o->enrollments->pluck('student_id');
            foreach ($o->schedule->where('weekday', $today->isoWeekday()) as $slot) $classes->push(['id' => $slot->id, 'offering_id' => $o->id, 'course' => $name, 'start' => substr($slot->start, 0, 5), 'end' => substr($slot->end, 0, 5), 'room' => $slot->room, 'teacher' => $o->teacher->name]);
            foreach ($o->assignments as $a) {
                $received = $a->submissions; $own = $student ? $received->firstWhere('student_id', $u->id) : null;
                $status = $student ? ($own ? ($own->score === null ? 'submitted' : 'graded') : ($a->due_at->lt(now()) ? 'overdue' : 'pending')) : ($received->isNotEmpty() && $received->every(fn ($s) => $s->score !== null) ? 'complete' : ($received->contains(fn ($s) => $s->score === null) ? 'review' : 'pending'));
                $tasks->push(['id' => $a->id, 'offering_id' => $o->id, 'title' => $a->title, 'description' => $a->description, 'course' => $name, 'due_at' => $a->due_at->toIso8601String(), 'submission_rate' => $roster->count() ? $received->count() / $roster->count() * 100 : 0, 'status' => $status, 'score' => $own?->score, 'feedback' => $own?->feedback]);
                if (!$student && $u->hasPermission(Permission::ManageAssignments)) foreach ($received as $s) $submissions->push(['id' => $s->id, 'assignment_id' => $a->id, 'title' => $a->title, 'course' => $name, 'student_name' => $s->student->name, 'submitted_at' => $s->submitted_at->toIso8601String(), 'score' => $s->score]);
            }
            foreach ($o->assignments->concat($o->lectures) as $content) foreach ($content->attachments as $f) $files->put($o->id.':'.$f->id, (new AcademicResource($f))->resolve($r) + ['offering_id' => $o->id, 'course' => $name, 'uploaded_at' => $f->created_at->toIso8601String()]);
            if ((!$student && $this->canGrades($u)) || $student) {
                if ($o->grade_status !== GradeStatus::Draft) foreach ($o->components as $c) foreach ($c->entries as $e) {
                    if ($student && $e->student_id !== $u->id) continue;
                    $grades->push(['id' => $e->id, 'offering_id' => $o->id, 'student_name' => $e->student->name, 'course' => $name, 'component' => $this->name($c), 'score' => $e->score, 'max_score' => $c->max_score, 'feedback' => $e->feedback, 'status' => $o->grade_status->value, 'updated_at' => $e->updated_at->toIso8601String()]);
                }
            }
            if (!$student && $roster->isNotEmpty()) {
                $sessions = $o->attendanceSessions->filter(fn ($s) => $s->date->toDateString() <= $day);
                if ($u->role === Role::Teacher && $u->hasPermission(Permission::TakeAttendance)) {
                    foreach ($sessions as $s) { $pending = $roster->count() - $s->records->whereIn('student_id', $roster)->count(); if ($pending) $work->push(['kind' => 'attendance', 'offering_id' => $o->id, 'course' => $name, 'date' => $s->date->toDateString(), 'pending' => $pending]); }
                    if ($o->schedule->contains('weekday', $today->isoWeekday()) && !$sessions->contains(fn ($s) => $s->date->toDateString() === $day)) $work->push(['kind' => 'attendance', 'offering_id' => $o->id, 'course' => $name, 'date' => $day, 'pending' => $roster->count()]);
                }
                if ($this->canGrades($u) && $o->grade_status === GradeStatus::Draft) $work->push(['kind' => 'grades', 'offering_id' => $o->id, 'course' => $name, 'date' => null, 'pending' => max(0, $roster->count() * $o->components->count() - $o->components->flatMap->entries->whereIn('student_id', $roster)->count())]);
            }
        }
        $courses = $scope->map(fn ($o) => ['id' => $o->id, 'code' => $o->course->code, 'name' => $this->name($o->course), 'credits' => $o->course->credits, 'teacher' => $o->teacher->name, 'students' => $o->enrollments->count(), 'sessions' => $o->attendanceSessions->filter(fn ($s) => $s->date->toDateString() <= $day)->count(), 'attendance_percent' => $this->attendance(collect([$o]), $u)]);
        $reviews = $scope->flatMap->assignments->flatMap->submissions->whereNull('score')->count();
        $attendance = $this->attendance($scope, $u);
        $metrics = $student ? [['key' => 'average', 'value' => $grading->average($scope->map(fn ($o) => ['total' => $grading->studentTotal($o, $u->id), 'credits' => $o->course->credits])), 'percent' => true], ['key' => 'attendance', 'value' => $attendance, 'percent' => true], ['key' => 'courses', 'value' => $scope->count()]] :
            ($u->role === Role::Teacher ? [['key' => 'courses', 'value' => $scope->count()], ['key' => 'students', 'value' => $scope->flatMap->enrollments->pluck('student_id')->unique()->count()], $u->hasPermission(Permission::ManageAssignments) ? ['key' => 'reviews', 'value' => $reviews] : ['key' => 'attendance', 'value' => $attendance, 'percent' => true]] : [['key' => 'students', 'value' => User::where('role', 'student')->count()], ['key' => 'teachers', 'value' => User::where('role', 'teacher')->count()], ['key' => 'courses', 'value' => $scope->count()], ['key' => 'reviews', 'value' => $reviews]]);
        $ids = $courseMatches->pluck('id');
        $summaryGrades = $grades->whereIn('offering_id', $ids)->sortByDesc('updated_at')->values();
        $summaryWork = $work->whereIn('offering_id', $ids)->sortByDesc('date')->values();
        $summarySubmissions = $submissions->filter(fn ($s) => $matches($s['course'][app()->getLocale()]))->sortByDesc('submitted_at')->values();
        $notices = app(AnnouncementService::class)->visible($u, $selected->pluck('id')->all())->get()->filter(fn ($a) => (!$r->filled('offering_id') || $a->offering_id === $r->integer('offering_id')) && $matches($a->title, $a->body))->sortByDesc('created_at')->take(10)->map(fn ($a) => (new AcademicResource($a))->resolve($r) + ['author_name' => $a->author->name])->values();
        $dates = $selected->flatMap->attendanceSessions->map(fn ($s) => $s->date->toDateString())->filter(fn ($d) => $d <= $day)->unique()->sort()->take(-6);
        $series = $dates->map(fn ($d) => ['label' => CarbonImmutable::parse($d)->locale(app()->getLocale())->translatedFormat('j M Y'), 'attendance' => $this->attendance($selected, $u, $d)])->filter(fn ($v) => $v['attendance'] !== null)->values();
        $distribution = collect(['0–49', '50–59', '60–69', '70–79', '80–89', '90–100'])->map(fn ($label) => ['label' => $label, 'students' => 0])->all(); $complete = 0;
        if (!$student && $this->canGrades($u)) foreach ($courseMatches as $o) foreach ($o->enrollments as $enrollment) {
            $total = $grading->total($o->components, $o->components->flatMap(fn ($c) => $c->entries->where('student_id', $enrollment->student_id))); if ($total === null) continue;
            $index = $total < 50 ? 0 : min(5, (int) floor($total / 10) - 4); $distribution[$index]['students']++; $complete++;
        }
        return ['summary' => ['role' => $u->role->value, 'as_of' => $day, 'semester' => $semester ? new StructureResource($semester) : null, 'metrics' => $metrics, 'courses' => $courses->values(), 'today' => $classes->whereIn('offering_id', $ids)->sortBy('start')->values(), 'latest_grades' => $summaryGrades->take(3), 'pending_work' => $summaryWork->take(3), 'recent_submissions' => $summarySubmissions->take(3), 'announcements' => $notices, 'attendance_series' => $series, 'grade_distribution' => $complete ? $distribution : []], 'tasks' => $tasks, 'files' => $files->values(), 'work' => $work, 'submissions' => $submissions, 'grades' => $grades];
    }
}
