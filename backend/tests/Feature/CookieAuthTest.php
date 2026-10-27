<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Auth, DB};
use Tests\TestCase;

class CookieAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['lms.auth_mode' => 'cookie', 'sanctum.guard' => ['web']]);
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept-Language' => 'en']);
    }
    private function rememberSession($response): void
    {
        $cookie = $response->getCookie(config('session.cookie'), false);
        $this->assertNotNull($cookie);
        $this->withUnencryptedCookie($cookie->getName(), $cookie->getValue());
        Auth::forgetGuards();
    }

    public function test_database_cookie_login_password_rotation_and_logout(): void
    {
        $admin = User::factory()->admin()->create();
        $login = $this->postJson('/api/v1/auth/login', ['identifier' => $admin->email, 'password' => 'TestPassword123!'])->assertOk()->assertJsonMissingPath('data.token');
        $this->rememberSession($login);
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $admin->id);
        $this->assertDatabaseHas('sessions', ['user_id' => $admin->id]);
        DB::table('sessions')->insert(['id' => 'other-device', 'user_id' => $admin->id, 'payload' => base64_encode(serialize([])), 'last_activity' => time()]);
        $admin->createToken('other-device');
        $changed = $this->putJson('/api/v1/profile/password', ['current_password' => 'TestPassword123!', 'password' => 'NewPassword456!', 'password_confirmation' => 'NewPassword456!'])->assertOk();
        $this->assertDatabaseMissing('sessions', ['id' => 'other-device']);
        $this->assertSame(0, $admin->tokens()->count());
        $this->rememberSession($changed);
        $this->getJson('/api/v1/auth/me')->assertOk();
        $out = $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->rememberSession($out);
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_csrf_cookie_and_cookie_mode_csrf_protection_are_active(): void
    {
        $user = User::factory()->create();
        // Enable normal CSRF middleware behavior instead of PHPUnit's exemption.
        $this->app->instance('env', 'local');
        $csrf = $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $this->rememberSession($csrf);
        $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'TestPassword123!'])->assertStatus(419)->assertJsonStructure(['message']);
        $cookie = $csrf->getCookie('XSRF-TOKEN', false);
        $this->assertNotNull($cookie);
        $this->withHeader('X-XSRF-TOKEN', $cookie->getValue());
        $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'TestPassword123!'])->assertOk();
    }

    public function test_a_late_cookie_session_write_cannot_survive_a_password_reset(): void
    {
        $user = User::factory()->teacher()->create();
        $login = $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'TestPassword123!'])->assertOk();
        $this->rememberSession($login);
        $stale = DB::table('sessions')->where('user_id', $user->id)->first();
        $this->assertNotNull($stale);
        app(\App\Services\Accounts\AccountService::class)->resetPassword($user);
        // Simulate an in-flight session write finishing after reset's deletion.
        DB::table('sessions')->insert((array) $stale);
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }
}
