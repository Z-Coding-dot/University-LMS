<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Controller;
use App\Http\Requests\AcademicSettingsRequest;
use App\Http\Resources\SettingsResource;
use App\Models\AcademicSetting;
use App\Services\Academic\GradingService;
use App\Support\{ApiResponse, AcademicValidation as V};
use Illuminate\Support\Facades\DB;
class SettingsController extends Controller
{
    public function __invoke(AcademicSettingsRequest $r, GradingService $s) { $d = $r->validated(); V::check($s->validScale($d['letter_scale']), 'letter_scale'); $row = DB::transaction(function () use ($d) { $row = AcademicSetting::whereKey(1)->lockForUpdate()->firstOrFail(); $row->update($d); return $row; }); return ApiResponse::data(new SettingsResource($row)); }
}
