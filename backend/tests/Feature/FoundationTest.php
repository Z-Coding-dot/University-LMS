<?php

namespace Tests\Feature;

use App\Enums\{Permission, Role};
use App\Models\{AcademicSetting, Course, CourseOffering, Department, User};
use App\Services\Academic\OfferingAccess;
use Database\Seeders\ProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Tests\TestCase;

class FoundationTest extends TestCase
{
    use RefreshDatabase;

    private function api(string $method, string $path, array $data = [], ?string $token = null, string $locale = 'en')
    {
        Auth::forgetGuards();
        return $this->json($method, '/api/v1'.$path, $data, array_filter(['Accept-Language' => $locale, 'Authorization' => $token ? 'Bearer '.$token : null]));
    }
    private function token(User $user): string { return $user->createToken('test')->plainTextToken; }

    public function test_forced_admin_can_only_read_identity_logout_and_change_password(): void
    {
        $user = User::factory()->admin()->create(['must_change_password' => true]);
        $login = $this->api('POST', '/auth/login', ['identifier' => strtoupper($user->email), 'password' => 'TestPassword123!'])->assertOk()->assertJsonPath('data.user.must_change_password', true);
        $token = $login->json('data.token');
        $other = $this->token($user);
        $this->api('GET', '/auth/me', [], $token)->assertOk()->assertJsonMissingPath('data.password');
        foreach (['/settings', '/catalog', '/profile/context', '/admin/students', '/admin/teachers'] as $path) $this->api('GET', $path, [], $token)->assertForbidden();
        $this->api('PUT', '/profile/password', ['current_password' => 'incorrect', 'password' => 'ChangedPassword456!', 'password_confirmation' => 'ChangedPassword456!'], $token)->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->api('PUT', '/profile/password', ['current_password' => 'TestPassword123!', 'password' => 'ChangedPassword456!', 'password_confirmation' => 'ChangedPassword456!'], $token)->assertOk()->assertJsonPath('data.must_change_password', false);
        $this->assertTrue(Hash::check('ChangedPassword456!', $user->fresh()->password));
        $this->api('GET', '/auth/me', [], $other)->assertUnauthorized();
        $this->api('GET', '/admin/students', [], $token)->assertOk();
        $this->api('POST', '/auth/logout', [], $token)->assertNoContent();
        $this->api('GET', '/auth/me', [], $token)->assertUnauthorized();
    }

    public function test_passwords_preserve_digits_whitespace_and_characters_after_byte_72(): void
    {
        $password = '  '.str_repeat('a', 74).'\u06f1\u06f2Z!  ';
        $password = str_replace(['\\u06f1', '\\u06f2'], [mb_chr(0x6f1), mb_chr(0x6f2)], $password);
        $user = User::factory()->teacher()->create(['email' => 'teacher12@campus.test', 'password' => Hash::make($password), 'must_change_password' => true]);
        $identifier = ' TEACHER'.mb_chr(0x6f1).mb_chr(0x662).'@CAMPUS.TEST ';
        $this->api('POST', '/auth/login', ['identifier' => $identifier, 'password' => $password])->assertOk()->assertJsonPath('data.user.must_change_password', false);
        $this->api('POST', '/auth/login', ['identifier' => $user->email, 'password' => trim($password)])->assertUnprocessable()->assertJsonValidationErrors('identifier');
        $this->api('POST', '/auth/login', ['identifier' => $user->email, 'password' => substr($password, 0, 72).'DIFFERENT'])->assertUnprocessable();
    }

    public function test_unknown_users_and_wrong_passwords_share_the_same_generic_error_and_login_is_throttled(): void
    {
        $this->withHeader('Origin', 'http://localhost:5173'); // Token requests stay stateless for SPA origins.
        $user = User::factory()->create();
        $wrong = $this->api('POST', '/auth/login', ['identifier' => $user->email, 'password' => 'incorrect'])->assertUnprocessable()->json();
        $unknown = $this->api('POST', '/auth/login', ['identifier' => 'unknown@campus.test', 'password' => 'incorrect'])->assertUnprocessable()->json();
        $this->assertSame($wrong, $unknown);
        for ($i = 0; $i < 4; $i++) $this->api('POST', '/auth/login', ['identifier' => $user->email, 'password' => 'incorrect'])->assertUnprocessable();
        $this->api('POST', '/auth/login', ['identifier' => $user->email, 'password' => 'TestPassword123!'])->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_inactive_accounts_cannot_login_and_existing_sessions_and_tokens_are_revoked(): void
    {
        $user = User::factory()->inactive()->create();
        $token = $this->token($user);
        DB::table('sessions')->insert(['id' => 'inactive-session', 'user_id' => $user->id, 'payload' => base64_encode(serialize([])), 'last_activity' => time()]);
        $this->api('POST', '/auth/login', ['identifier' => $user->email, 'password' => 'TestPassword123!'])->assertForbidden();
        $this->api('GET', '/auth/me', [], $token)->assertForbidden();
        $this->assertSame(0, $user->tokens()->count());
        $this->assertDatabaseMissing('sessions', ['id' => 'inactive-session']);
    }

    public function test_managed_accounts_can_only_change_their_language_even_with_legacy_flags(): void
    {
        foreach (['student', 'teacher'] as $role) {
            $user = User::factory()->create(['role' => $role, 'must_change_password' => true]);
            $token = $this->token($user);
            $this->api('GET', '/auth/me', [], $token)->assertOk()->assertJsonPath('data.must_change_password', false);
            $this->api('PATCH', '/profile', ['locale' => 'fa'], $token)->assertOk()->assertJsonPath('data.locale', 'fa');
            foreach (['name', 'email', 'password', 'current_password', 'password_confirmation'] as $field) {
                $this->api('PATCH', '/profile', ['locale' => 'en', $field => null], $token)->assertForbidden();
            }
            $this->api('PUT', '/profile/password', [], $token)->assertForbidden();
        }
    }

    public function test_admin_authorization_precedes_target_lookup_and_payload_validation(): void
    {
        $this->api('PATCH', '/admin/students/999999', [])->assertUnauthorized();
        foreach (['teacher', 'student'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            foreach (['students', 'teachers'] as $resource) $this->api('PATCH', '/admin/'.$resource.'/999999', ['name' => []], $this->token($user))->assertForbidden();
        }
        $admin = User::factory()->admin()->create(); $token = $this->token($admin);
        $this->api('PATCH', '/admin/students/999999', [], $token)->assertNotFound();
        $teacher = User::factory()->teacher()->create();
        $this->api('PATCH', '/admin/students/'.$teacher->id, [], $token)->assertNotFound();
    }

    public function test_account_creation_issues_unique_credentials_and_reset_and_deactivation_revoke_access(): void
    {
        $admin = User::factory()->admin()->create(); $token = $this->token($admin);
        $one = $this->api('POST', '/admin/students', ['name' => 'First student', 'email' => ' First@Campus.Test ', 'locale' => 'en'], $token)->assertCreated()->assertJsonPath('data.user.profile.institutional_id', 'ST-001')->assertJsonPath('data.user.email', 'first@campus.test');
        $two = $this->api('POST', '/admin/students', ['name' => 'Second student', 'email' => 'second@campus.test', 'locale' => 'fa'], $token)->assertCreated()->assertJsonPath('data.user.profile.institutional_id', 'ST-002');
        $this->assertNotSame($one->json('data.initial_password'), $two->json('data.initial_password'));
        $this->assertGreaterThanOrEqual(12, strlen($one->json('data.initial_password')));
        $user = User::findOrFail($one->json('data.user.id')); $studentToken = $this->token($user);
        $this->assertTrue(Hash::check($one->json('data.initial_password'), $user->password));
        DB::table('sessions')->insert(['id' => 'student-session', 'user_id' => $user->id, 'payload' => base64_encode(serialize([])), 'last_activity' => time()]);
        $reset = $this->api('POST', '/admin/students/'.$user->id.'/reset-password', [], $token)->assertOk();
        $this->assertNotSame($one->json('data.initial_password'), $reset->json('data.initial_password'));
        $this->assertDatabaseMissing('sessions', ['id' => 'student-session']);
        $this->api('GET', '/auth/me', [], $studentToken)->assertUnauthorized();
        $this->api('GET', '/admin/students', [], $token)->assertOk()->assertJsonMissingPath('data.0.password')->assertJsonMissingPath('data.0.initial_password');
        $newToken = $this->token($user);
        $this->api('PATCH', '/admin/students/'.$user->id.'/status', ['status' => 'inactive'], $token)->assertOk();
        $this->api('GET', '/auth/me', [], $newToken)->assertUnauthorized();
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_strict_identity_permissions_and_academic_profile_validation(): void
    {
        $admin = User::factory()->admin()->create(); $token = $this->token($admin);
        $student = User::factory()->student()->create(); $teacher = User::factory()->teacher()->create();
        $this->api('POST', '/admin/students', ['name' => 'New Student', 'email' => 'new@campus.test', 'locale' => 'en', 'role' => 'admin'], $token)->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->api('PATCH', '/admin/students/'.$student->id, ['name' => 'Changed', 'email' => strtoupper($teacher->email)], $token)->assertUnprocessable()->assertJsonValidationErrors('email');
        $path = '/admin/teachers/'.$teacher->id.'/permissions';
        foreach ([['grades.unlock'], ['grades.enter', 'grades.enter'], ['unknown']] as $permissions) $this->api('PUT', $path, ['permissions' => $permissions], $token)->assertUnprocessable();
        $this->api('PUT', $path, ['permissions' => Permission::teacherGrants()], $token)->assertOk()->assertJsonCount(7, 'data.permissions');
        $this->api('PUT', $path, ['permissions' => []], $token)->assertOk()->assertJsonCount(0, 'data.permissions');
        $department = Department::factory()->create();
        $this->api('PATCH', '/admin/students/'.$student->id.'/academic-profile', ['department_id' => $department->id, 'current_semester_id' => null], $token)->assertOk()->assertJsonPath('data.profile.department_id', $department->id);
        $this->api('PATCH', '/admin/students/'.$student->id.'/academic-profile', ['department_id' => 999999, 'current_semester_id' => null], $token)->assertUnprocessable();
        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_lists_have_exact_meta_and_whitelisted_sort_and_bounded_pagination(): void
    {
        $admin = User::factory()->admin()->create(); $token = $this->token($admin);
        User::factory()->student()->create(['name' => 'Zulu']); User::factory()->student()->create(['name' => 'Alpha']);
        $response = $this->api('GET', '/admin/students?per_page=1&sort=name&page=1', [], $token)->assertOk()->assertJsonPath('data.0.name', 'Alpha')->assertJsonPath('meta', ['current_page' => 1, 'per_page' => 1, 'total' => 2, 'last_page' => 2]);
        $this->assertSame(['data', 'meta'], array_keys($response->json()));
        $this->api('GET', '/admin/students?sort=password', [], $token)->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->api('GET', '/admin/students?page=0&per_page=101', [], $token)->assertUnprocessable()->assertJsonValidationErrors(['page', 'per_page']);
        $this->api('GET', '/admin/students?search=ALPHA', [], $token)->assertOk()->assertJsonCount(1, 'data');
        $this->api('GET', '/admin/students?search=%25', [], $token)->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_offering_access_separates_ownership_from_permissions(): void
    {
        $teacher = User::factory()->teacher()->create(); $other = User::factory()->teacher()->create();
        $student = User::factory()->student()->create(); $admin = User::factory()->admin()->create();
        $offering = CourseOffering::factory()->create(['teacher_id' => $teacher->id]);
        $offering->enrollments()->create(['student_id' => $student->id]);
        $access = app(OfferingAccess::class);
        $this->assertSame($offering->id, $access->find($student, $offering->id)->id);
        $this->assertFalse($admin->hasPermission(Permission::TakeAttendance));
        $this->assertTrue($admin->hasPermission(Permission::UnlockGrades));
        foreach ([$other, User::factory()->student()->create()] as $unauthorized) {
            try { $access->find($unauthorized, $offering->id); $this->fail('IDOR accepted'); }
            catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(403, $e->getStatusCode()); }
        }
        $teacher->permissions()->create(['permission' => 'grades.enter']);
        $this->assertSame($offering->id, $access->find($teacher, $offering->id, Permission::EnterGrades)->id);
    }

    public function test_json_errors_are_localized_even_without_an_accept_header_and_catalog_matches_contract(): void
    {
        $this->withHeaders(['Accept' => 'text/html', 'Accept-Language' => 'fa-AF'])->get('/api/v1/auth/me')->assertUnauthorized()->assertJsonPath('message', __('messages.unauthenticated', [], 'fa'));
        $this->withHeaders(['Accept' => 'text/html', 'Accept-Language' => 'en'])->get('/api/v1/unknown')->assertNotFound()->assertJsonMissingPath('exception')->assertHeader('X-Content-Type-Options', 'nosniff');
        $student = User::factory()->create(); $token = $this->token($student);
        AcademicSetting::factory()->create(); Course::factory()->create();
        $this->api('GET', '/settings', [], $token)->assertOk()->assertJsonPath('data.pass_mark', 55);
        $this->api('GET', '/catalog', [], $token)->assertOk()->assertJsonStructure(['data' => ['courses' => [['id', 'code', 'name' => ['fa', 'en'], 'credits', 'department_id']], 'departments', 'faculties', 'semesters', 'academic_years']]);
    }

    public function test_production_seeder_is_idempotent_and_never_overwrites_credentials(): void
    {
        config(['lms.initial_admin' => ['name' => 'University admin', 'email' => 'Admin@Campus.test', 'password' => 'InitialPassword123!']]);
        $this->seed(ProductionSeeder::class);
        $admin = User::where('role', Role::Admin)->firstOrFail();
        $this->assertSame('AD-001', $admin->institutional_id);
        $this->assertTrue($admin->must_change_password);
        $hash = $admin->password;
        config(['lms.initial_admin.password' => 'AnotherPassword456!']);
        $this->seed(ProductionSeeder::class);
        $this->assertSame($hash, $admin->fresh()->password);
        $this->assertDatabaseCount('academic_settings', 1);
    }
}
