<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Http\Resources\SettingsResource;
use App\Models\AcademicSetting;
use App\Support\ApiResponse;

class SettingsController extends Controller
{
    public function __invoke() { return ApiResponse::data(new SettingsResource(AcademicSetting::findOrFail(1))); }
}
