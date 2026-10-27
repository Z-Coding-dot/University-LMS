<?php
namespace Tests\Feature;
use App\Models\{User, CourseOffering, Enrollment, GradeEntry, AcademicSetting, Semester};
use App\Services\Academic\{GradingService, AttendanceService, SemesterService};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;
class AcademicTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); AcademicSetting::factory()->create(); }
    private function callAs(User $u, string $method, string $path, array $data = []) { Auth::forgetGuards(); return $this->json($method, '/api/v1'.$path, $data, ['Accept-Language' => 'en', 'Authorization' => 'Bearer '.$u->createToken('test')->plainTextToken]); }
    public function test_admin_academic_enrollment_capacity_and_schedule_conflicts(): void {
        $admin = User::factory()->admin()->create(); $teacher = User::factory()->teacher()->create(); $student = User::factory()->student()->create();
        $o = CourseOffering::factory()->create(['teacher_id' => $teacher->id, 'capacity' => 1]);
        $this->callAs($student, 'POST', '/admin/offerings/9999/enrollments', [])->assertForbidden();
        $this->callAs($admin, 'PUT', '/admin/offerings/'.$o->id.'/schedule', ['slots' => [['weekday' => 1, 'start' => '09:00', 'end' => '10:00', 'room' => 'A']]])->assertOk();
        $this->callAs($admin, 'POST', '/admin/offerings/'.$o->id.'/enrollments', ['student_ids' => [$student->id], 'make_current' => true])->assertOk()->assertJsonPath('data.student_count', 1);
        $this->assertSame($o->semester_id, $student->fresh()->current_semester_id);
        $this->callAs($admin, 'POST', '/admin/offerings/'.$o->id.'/enrollments', ['student_ids' => [User::factory()->student()->create()->id], 'make_current' => false])->assertUnprocessable();
        $other = CourseOffering::factory()->create(['semester_id' => $o->semester_id, 'teacher_id' => $teacher->id]);
        $this->callAs($admin, 'PUT', '/admin/offerings/'.$other->id.'/schedule', ['slots' => [['weekday' => 1, 'start' => '09:30', 'end' => '11:00', 'room' => 'B']]])->assertUnprocessable();
        $this->callAs($admin, 'PUT', '/admin/offerings/'.$other->id.'/schedule', ['slots' => [['weekday' => 1, 'start' => '10:00', 'end' => '11:00', 'room' => 'B']]])->assertOk();
        $this->callAs($admin, 'GET', '/admin/offerings?sort=teacher')->assertOk();
        $this->callAs($admin, 'GET', '/admin/teacher-activity')->assertOk();
    }
    public function test_ownership_attendance_and_grade_lifecycle(): void {
        $teacher = User::factory()->teacher()->create(); foreach (['grades.enter', 'grades.publish', 'attendance.take'] as $p) $teacher->permissions()->create(['permission' => $p]);
        $o = CourseOffering::factory()->create(['teacher_id' => $teacher->id]); $student = User::factory()->student()->create(); Enrollment::create(['offering_id' => $o->id, 'student_id' => $student->id]);
        foreach ([User::factory()->teacher()->create(), User::factory()->student()->create()] as $u) $this->callAs($u, 'GET', '/courses/'.$o->id)->assertForbidden();
        $admin = User::factory()->admin()->create(); $this->callAs($admin, 'POST', '/courses/'.$o->id.'/attendance', [])->assertForbidden();
        $this->callAs($teacher, 'POST', '/courses/'.$o->id.'/attendance', ['date' => now()->toDateString(), 'records' => [['student_id' => $student->id, 'status' => 'late']]])->assertOk();
        $component = ['name' => ['fa' => 'نهایی', 'en' => 'Final'], 'max_score' => 100, 'weight' => 100];
        $id = $this->callAs($teacher, 'PUT', '/courses/'.$o->id.'/grade-components', ['components' => [$component]])->assertOk()->json('data.0.id');
        $this->callAs($teacher, 'PUT', '/courses/'.$o->id.'/grade-status', ['status' => 'published'])->assertUnprocessable();
        $this->callAs($teacher, 'PUT', '/courses/'.$o->id.'/grades', ['entries' => [['student_id' => $student->id, 'component_id' => $id, 'score' => 87, 'feedback' => 'Private draft']]])->assertOk();
        $component['id'] = $id; $component['max_score'] = 50;
        $this->callAs($teacher, 'PUT', '/courses/'.$o->id.'/grade-components', ['components' => [$component]])->assertUnprocessable();
        foreach (['published', 'locked'] as $status) $this->callAs($teacher, 'PUT', '/courses/'.$o->id.'/grade-status', ['status' => $status])->assertOk();
        $this->callAs($teacher, 'PUT', '/courses/'.$o->id.'/grade-status', ['status' => 'published'])->assertForbidden();
        $this->callAs($admin, 'PUT', '/courses/'.$o->id.'/grade-status', ['status' => 'published'])->assertOk();
        $this->callAs($student, 'GET', '/courses/'.$o->id)->assertOk()->assertJsonPath('data.grades.0.score', 87);
        $this->callAs($student, 'GET', '/results')->assertOk()->assertJsonPath('data.cumulative_average', 87);
    }
    public function test_draft_scores_and_feedback_are_hidden_on_all_student_academic_paths(): void {
        $s = User::factory()->student()->create(); $o = CourseOffering::factory()->create(); Enrollment::create(['offering_id' => $o->id, 'student_id' => $s->id]);
        $c = $o->components()->create(['name_fa' => 'نهایی', 'name_en' => 'Final', 'max_score' => 100, 'weight' => 100]); GradeEntry::create(['student_id' => $s->id, 'component_id' => $c->id, 'score' => 87.123, 'feedback' => 'SECRET_DRAFT']);
        foreach (['/courses/'.$o->id, '/courses/'.$o->id.'/grade-breakdown', '/results', '/results/courses?semester_id='.$o->semester_id] as $path) { $res = $this->callAs($s, 'GET', $path)->assertOk(); $this->assertStringNotContainsString('SECRET_DRAFT', $res->getContent()); $this->assertStringNotContainsString('87.123', $res->getContent()); }
        $this->callAs($s, 'GET', '/courses/'.$o->id.'/grades')->assertForbidden();
        $this->callAs($s, 'GET', '/courses/'.$o->id.'/grade-breakdown?sort=bad')->assertUnprocessable();
    }
    public function test_shared_calculations_and_kabul_week_boundaries(): void {
        $g = app(GradingService::class); $cs = [['id' => 1, 'max_score' => 20, 'weight' => 40], ['id' => 2, 'max_score' => 50, 'weight' => 60]];
        $this->assertSame(68.0, $g->total($cs, [['component_id' => 1, 'score' => 10], ['component_id' => 2, 'score' => 40]])); $this->assertNull($g->total($cs, []));
        $this->assertSame(65.0, $g->average([['total' => 80, 'credits' => 1], ['total' => 60, 'credits' => 3]])); $this->assertNull($g->average([]));
        $scale = [['min' => 55, 'max' => 100, 'letter' => 'P'], ['min' => 0, 'max' => 55, 'letter' => 'F']]; $this->assertTrue($g->validScale($scale)); $this->assertSame('P', $g->letter(100, $scale)); $this->assertSame('P', $g->letter(55, $scale));
        $this->assertFalse($g->validScale([['min' => 0, 'max' => 50, 'letter' => 'F'], ['min' => 51, 'max' => 100, 'letter' => 'A']]));
        $a = app(AttendanceService::class); $this->assertSame(50.0, $a->percent(['present', 'absent'], ['present'], 2)); $this->assertNull($a->percent([], ['present'], 0));
        $semester = Semester::factory()->create(['starts_at' => '2026-01-01', 'ends_at' => '2026-06-01']);
        foreach (['2026-01-01' => 1, '2026-01-08' => 2, '2026-05-31' => 16, '2026-06-02' => null] as $date => $week) { $this->travelTo(\Carbon\Carbon::parse($date.' 00:00:00', 'Asia/Kabul')); $this->assertSame($week, app(SemesterService::class)->week($semester)); } $this->travelBack();
    }
    public function test_structure_references_dates_and_settings_validation(): void {
        $a = User::factory()->admin()->create(); $name = ['fa' => 'نام', 'en' => 'Name'];
        $faculty = $this->callAs($a, 'POST', '/admin/structure/faculties', ['name' => $name])->assertCreated()->json('data.id');
        $department = $this->callAs($a, 'POST', '/admin/structure/departments', ['name' => $name, 'faculty_id' => $faculty])->assertCreated()->json('data.id');
        $this->callAs($a, 'DELETE', '/admin/structure/faculties/'.$faculty)->assertUnprocessable();
        $this->callAs($a, 'DELETE', '/admin/structure/departments/'.$department, ['unexpected' => true])->assertUnprocessable();
        $this->callAs($a, 'DELETE', '/admin/structure/departments/'.$department)->assertNoContent();
        $this->callAs($a, 'DELETE', '/admin/structure/faculties/'.$faculty)->assertNoContent();
        $year = $this->callAs($a, 'POST', '/admin/structure/academic-years', ['name' => '2026', 'starts_at' => '2026-01-01', 'ends_at' => '2026-12-31'])->assertCreated()->json('data.id');
        $input = ['name' => $name, 'academic_year_id' => $year, 'starts_at' => '2025-12-01', 'ends_at' => '2026-06-01'];
        $this->callAs($a, 'POST', '/admin/structure/semesters', $input)->assertUnprocessable();
        $input['starts_at'] = '2026-01-01'; $this->callAs($a, 'POST', '/admin/structure/semesters', $input)->assertCreated();
        $this->callAs($a, 'PATCH', '/admin/structure/academic-years/'.$year, ['name' => '2026', 'starts_at' => '2026-02-01', 'ends_at' => '2026-12-31'])->assertUnprocessable();
        $settings = (new \App\Http\Resources\SettingsResource(AcademicSetting::findOrFail(1)))->resolve();
        $this->callAs($a, 'PUT', '/admin/settings', $settings)->assertOk();
        $settings['letter_scale'][0]['min'] = 56; $this->callAs($a, 'PUT', '/admin/settings', $settings)->assertUnprocessable();
        $this->callAs($a, 'GET', '/admin/structure/unknown')->assertNotFound();
    }
}
