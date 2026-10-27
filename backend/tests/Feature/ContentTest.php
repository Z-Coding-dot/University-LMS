<?php
namespace Tests\Feature;
use App\Models\{User, CourseOffering, Enrollment, AcademicSetting, Assignment, Upload};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{Auth, Storage};
use Tests\TestCase;
class ContentTest extends TestCase
{
    use RefreshDatabase;
    private function asUser(User $u): static { Auth::forgetGuards(); return $this->withHeaders(['Accept-Language' => 'en', 'Authorization' => 'Bearer '.$u->createToken('test')->plainTextToken]); }
    public function test_private_uploads_course_content_and_submission_idor(): void {
        Storage::fake('local'); AcademicSetting::factory()->create();
        $t = User::factory()->teacher()->create(); foreach (['materials.manage', 'assignments.manage', 'announcements.post'] as $p) $t->permissions()->create(['permission' => $p]);
        $o = CourseOffering::factory()->create(['teacher_id' => $t->id]); $s = User::factory()->student()->create(); Enrollment::create(['offering_id' => $o->id, 'student_id' => $s->id]);
        $other = User::factory()->student()->create(); Enrollment::create(['offering_id' => $o->id, 'student_id' => $other->id]);
        $upload = fn ($u, $purpose, $name = 'notes.pdf', $content = "%PDF-1.4\nexample") => $this->asUser($u)->post('/api/v1/uploads', ['offering_id' => $o->id, 'purpose' => $purpose, 'files' => [UploadedFile::fake()->createWithContent($name, $content)]]);
        $upload($s, 'lecture')->assertForbidden(); $upload(User::factory()->teacher()->create(), 'lecture')->assertForbidden();
        $upload($t, 'lecture', 'fake.pdf', 'plain text')->assertUnprocessable();
        $file = $upload($t, 'lecture')->assertCreated()->json('data.0.id');
        $this->asUser($s)->get('/api/v1/files/'.$file)->assertForbidden();
        $lecture = ['offering_id' => $o->id, 'week_number' => 4, 'title' => 'Original / title', 'description' => '', 'attachment_ids' => [$file]];
        $this->asUser($t)->postJson('/api/v1/courses/'.$o->id.'/lectures', $lecture)->assertCreated()->assertJsonPath('data.title', 'Original / title');
        $this->asUser($s)->get('/api/v1/files/'.$file)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->asUser($s)->getJson('/api/v1/courses/'.$o->id.'/lectures')->assertOk()->assertJsonCount(1, 'data');
        $this->asUser($s)->getJson('/api/v1/courses/'.$o->id.'/weeks')->assertOk()->assertJsonCount(16, 'data.weeks');
        $a = $this->asUser($t)->postJson('/api/v1/assignments', ['offering_id' => $o->id, 'week_number' => 4, 'submission_enabled' => true, 'title' => 'Work', 'description' => 'Instructions', 'due_date' => now('Asia/Kabul')->addDay()->toDateString(), 'attachment_ids' => []])->assertCreated()->json('data.id');
        $this->asUser($s)->getJson('/api/v1/assignments')->assertOk()->assertJsonPath('data.0.submission', null);
        $mine = $upload($s, 'submission')->assertCreated()->json('data.0.id');
        $this->asUser($other)->postJson('/api/v1/assignments/'.$a.'/submissions', ['file_ids' => [$mine]])->assertUnprocessable();
        $id = $this->asUser($s)->postJson('/api/v1/assignments/'.$a.'/submissions', ['file_ids' => [$mine]])->assertCreated()->json('data.id');
        $this->asUser($other)->get('/api/v1/files/'.$mine)->assertForbidden();
        $this->asUser($s)->patchJson('/api/v1/submissions/'.$id, ['score' => 100, 'feedback' => 'bad'])->assertForbidden();
        $this->asUser($t)->patchJson('/api/v1/submissions/'.$id, ['score' => 0, 'feedback' => 'Revise'])->assertOk();
        $this->asUser($s)->postJson('/api/v1/assignments/'.$a.'/submissions', ['file_ids' => [$mine]])->assertForbidden();
        $this->asUser($t)->getJson('/api/v1/assignments/'.$a.'/submissions')->assertOk()->assertJsonPath('data.0.score', 0);
        $this->asUser($t)->postJson('/api/v1/announcements', ['title' => 'Notice', 'body' => 'Read', 'audience' => 'all'])->assertForbidden();
        $this->asUser($t)->postJson('/api/v1/announcements', ['title' => 'Notice', 'body' => 'Read', 'audience' => 'offering', 'offering_id' => $o->id, 'week_number' => 5])->assertCreated();
        $this->asUser($s)->getJson('/api/v1/announcements?offering_id='.$o->id)->assertOk()->assertJsonCount(1, 'data');
    }
    public function test_cleanup_only_removes_old_unattached_uploads(): void {
        Storage::fake('local'); $f = Upload::factory()->create(['created_at' => now()->subDays(2)]); Storage::disk('local')->put($f->path, 'file');
        $this->artisan('lms:cleanup-uploads')->assertSuccessful(); $this->assertDatabaseMissing('uploads', ['id' => $f->id]); Storage::disk('local')->assertMissing($f->path);
    }
}
