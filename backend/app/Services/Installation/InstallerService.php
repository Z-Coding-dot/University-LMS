<?php

namespace App\Services\Installation;

use Database\Seeders\ProductionSeeder;
use Illuminate\Support\Facades\Artisan;
use RuntimeException;

class InstallerService
{
    public function installed(): bool { return is_file(config('lms.installed_lock')); }

    public function install(): void
    {
        $configuredKey = (string) config('app.key');
        $key = str_starts_with($configuredKey, 'base64:') ? base64_decode(substr($configuredKey, 7), true) : $configuredKey;
        if ($key === false || !\Illuminate\Encryption\Encrypter::supported($key, config('app.cipher', 'AES-256-CBC')) || !in_array(config('lms.auth_mode'), ['cookie', 'token'], true)) throw new RuntimeException(__('messages.install_failed'));
        if (!app()->runningUnitTests() && config('database.default') !== 'mysql') throw new RuntimeException(__('messages.mysql_required'));
        $path = config('lms.installed_lock');
        $handle = fopen($path.'.installing', 'c');
        if (!$handle) throw new RuntimeException(__('messages.install_failed'));
        try {
            if (!flock($handle, LOCK_EX | LOCK_NB)) throw new RuntimeException(__('messages.install_busy'));
            if ($this->installed()) return;
            if (Artisan::call('migrate', ['--force' => true]) !== 0) throw new RuntimeException(__('messages.install_failed'));
            app(ProductionSeeder::class)->run();
            if (file_put_contents($path, now()->toIso8601String(), LOCK_EX) === false) throw new RuntimeException(__('messages.install_failed'));
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
