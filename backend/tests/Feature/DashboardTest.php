<?php
namespace Tests\Feature;
use App\Models\{User, CourseOffering};
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Auth, Storage};
use Tests\TestCase;
class DashboardTest extends TestCase
{
    use RefreshDatabase;
    private function asUser(User $u): static { Auth::forgetGuards(); return $this->withHeaders(['Accept-Language' => 'en', 'Authorization' => 'Bearer '.$u->createToken('test')->plainTextToken]); }
    protected function setUp(): void { parent::setUp(); $this->travelTo(\Carbon\Carbon::parse('2026-10-26 12:00:00', 'Asia/Kabul')); Storage::fake('local'); $this->seed(DemoSeeder::class); }
    protected function tearDown(): void { $this->travelBack(); parent::tearDown(); }
    public function test_demo_seeded_dashboard_academic_reads_and_grade_privacy(): void {
        $s = User::where('email', 'student1@campus.test')->firstOrFail();
        foreach (['/dashboard', '/dashboard/tasks?attention_only=1', '/dashboard/files', '/courses', '/courses/4', '/courses/4/weeks', '/courses/4/attendance-history', '/courses/4/grade-breakdown', '/results', '/results/courses?semester_id=2', '/timetable', '/assignments', '/assignments/4', '/announcements'] as $path) $this->asUser($s)->getJson('/api/v1'.$path)->assertOk();
        $summary = $this->asUser($s)->getJson('/api/v1/dashboard')->assertOk()->assertJsonCount(3, 'data.courses')->assertJsonCount(0, 'data.grade_distribution');
        foreach ($summary->json('data.latest_grades') as $row) $this->assertNotSame('draft', $row['status']);
        $component = CourseOffering::findOrFail(6)->components->first(); $component->entries()->where('student_id', $s->id)->update(['score' => 12.345, 'feedback' => 'SECRET_DASHBOARD']);
        foreach (['/dashboard', '/dashboard/tasks', '/dashboard/files', '/results', '/courses/6', '/courses/6/grade-breakdown'] as $path) { $res = $this->asUser($s)->getJson('/api/v1'.$path)->assertOk(); $this->assertStringNotContainsString('SECRET_DASHBOARD', $res->getContent()); $this->assertStringNotContainsString('12.345', $res->getContent()); }
        foreach (['work', 'submissions', 'grades'] as $feed) $this->asUser($s)->getJson('/api/v1/dashboard/'.$feed)->assertForbidden();
        $this->asUser($s)->getJson('/api/v1/dashboard?offering_id=1')->assertForbidden();
        $empty = User::factory()->student()->create(); $this->asUser($empty)->getJson('/api/v1/dashboard')->assertOk()->assertJsonCount(0, 'data.courses')->assertJsonPath('data.metrics.0.value', null);
    }
    public function test_staff_dashboard_permissions_and_authorization_matrix(): void {
        $t = User::findOrFail(2); $admin = User::findOrFail(1);
        foreach (['/dashboard', '/dashboard/work', '/dashboard/submissions', '/dashboard/grades?search=Ali', '/admin/catalog', '/admin/teacher-activity', '/admin/locked-grades', '/admin/structure/semesters'] as $path) $this->asUser($admin)->getJson('/api/v1'.$path)->assertOk();
        foreach (['/dashboard', '/dashboard/work', '/dashboard/submissions', '/dashboard/grades', '/courses/4/roster', '/courses/4/attendance', '/courses/4/grades', '/assignments/4/submissions'] as $path) $this->asUser($t)->getJson('/api/v1'.$path)->assertOk();
        foreach (['/courses/5', '/courses/5/weeks', '/courses/5/lectures', '/assignments/5', '/assignments/5/submissions', '/announcements?offering_id=5', '/dashboard?offering_id=5', '/dashboard/files?offering_id=5'] as $path) $this->asUser($t)->getJson('/api/v1'.$path)->assertForbidden();
        $this->asUser($t)->patchJson('/api/v1/submissions/2', ['score' => 90, 'feedback' => 'Other course'])->assertForbidden();
        $t->permissions()->delete();
        foreach (['/dashboard/work', '/dashboard/submissions', '/dashboard/grades', '/courses/4/grades', '/timetable'] as $path) $this->asUser($t)->getJson('/api/v1'.$path)->assertForbidden();
        $this->asUser($t)->getJson('/api/v1/dashboard')->assertOk()->assertJsonCount(0, 'data.latest_grades')->assertJsonCount(0, 'data.grade_distribution')->assertJsonCount(0, 'data.pending_work');
        $res = $this->asUser($admin)->getJson('/api/v1/dashboard')->assertOk(); $this->assertSame(75, array_sum(array_column($res->json('data.grade_distribution'), 'students')));
        foreach ($res->json('data.pending_work') as $row) $this->assertSame('grades', $row['kind']);
        foreach (['/dashboard/tasks?sort=unknown', '/dashboard/files?per_page=101', '/dashboard?offering_id=0'] as $path) $this->asUser($admin)->getJson('/api/v1'.$path)->assertUnprocessable();
    }
    public function test_seed_text_localization_is_removed_when_user_edits_content(): void {
        $t = User::findOrFail(2);
        $this->asUser($t)->getJson('/api/v1/courses/4/lectures?week_number=4')->assertOk()->assertJsonPath('data.0.title', 'Week four lecture');
        $this->asUser($t)->patchJson('/api/v1/courses/4/lectures/4', ['offering_id' => 4, 'week_number' => 4, 'title' => 'Keep / all text', 'description' => 'My content', 'attachment_ids' => []])->assertOk()->assertJsonPath('data.title', 'Keep / all text');
        $this->asUser($t)->withHeader('Accept-Language', 'fa')->getJson('/api/v1/courses/4/lectures?week_number=4')->assertOk()->assertJsonPath('data.0.title', 'Keep / all text');
    }
}
