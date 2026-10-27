<?php

namespace App\Http\Controllers;

use App\Services\Installation\InstallerService;

class InstallerController extends Controller
{
    public function __invoke(string $token, InstallerService $installer)
    {
        $configured = (string) config('lms.installer_token');
        abort_unless(strlen($configured) >= 32 && hash_equals($configured, $token) && !$installer->installed(), 404);
        try { $installer->install(); }
        catch (\Throwable) { return response()->json(['message' => __('messages.install_failed')], 500); }
        return response()->json(['message' => __('messages.installed')]);
    }
}
