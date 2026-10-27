<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class InstallerTest extends TestCase
{
    public function test_web_installer_is_disabled_without_a_token_and_runs_only_once(): void
    {
        $this->assertFalse(Schema::hasTable('sessions')); // A genuine first install, not a pre-migrated fixture.
        $token = str_repeat('test-only-token-', 3);
        $path = storage_path('framework/testing-install-'.bin2hex(random_bytes(6)).'.lock');
        config(['lms.installed_lock' => $path, 'lms.installer_token' => null,
            'lms.initial_admin' => ['name' => 'Administrator', 'email' => 'admin@campus.test', 'password' => 'InitialPassword123!']]);
        try {
            $this->get('/install/'.$token)->assertNotFound();
            config(['lms.installer_token' => $token]);
            $this->get('/install/incorrect-token')->assertNotFound();
            $this->get('/install/'.$token)->assertOk()->assertJsonStructure(['message']);
            $this->assertFileExists($path);
            $this->assertSame(1, User::where('role', 'admin')->count());
            $this->get('/install/'.$token)->assertNotFound();
            $this->artisan('lms:install')->assertSuccessful();
            $this->assertSame(1, User::where('role', 'admin')->count());
        } finally {
            foreach ([$path, $path.'.installing'] as $file) if (is_file($file)) unlink($file);
        }
    }
}
