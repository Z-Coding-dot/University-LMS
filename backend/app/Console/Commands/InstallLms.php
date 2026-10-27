<?php

namespace App\Console\Commands;

use App\Services\Installation\InstallerService;
use Illuminate\Console\Command;

class InstallLms extends Command
{
    protected $signature = 'lms:install';
    protected $description = 'Migrate the LMS database and create its first administrator once';
    public function handle(InstallerService $installer): int
    {
        if ($installer->installed()) { $this->info(__('messages.already_installed')); return self::SUCCESS; }
        try { $installer->install(); }
        catch (\Throwable $exception) {
            // Environment credentials, SQL, bindings and command output stay private.
            $this->error(__('messages.install_failed'));
            $this->line(__('messages.install_config_hint'));
            return self::FAILURE;
        }
        $this->info(__('messages.installed'));
        return self::SUCCESS;
    }
}
