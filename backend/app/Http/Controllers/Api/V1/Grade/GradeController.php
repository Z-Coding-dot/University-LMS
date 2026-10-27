<?php
namespace App\Http\Controllers\Api\V1\Grade;
use App\Http\Controllers\Controller;
use App\Http\Requests\{GradeBatchRequest, ComponentsRequest, GradeStatusRequest};
use App\Http\Resources\AcademicResource;
use App\Enums\{Role, Permission};
use App\Services\Academic\{OfferingAccess, GradeBookService};
use App\Support\ApiResponse;
use Illuminate\Http\Request;
class GradeController extends Controller
{
    public function show(Request $r, int $id, OfferingAccess $a) { $o = $a->find($r->user(), $id); abort_unless($r->user()->hasPermission(Permission::EnterGrades) || $r->user()->hasPermission(Permission::PublishGrades), 403); return ApiResponse::data(['components' => AcademicResource::collection($o->components), 'entries' => AcademicResource::collection($o->components->flatMap->entries), 'status' => $o->grade_status->value]); }
    public function update(GradeBatchRequest $r, int $id, OfferingAccess $a, GradeBookService $s) { $o = $a->find($r->user(), $id); $s->save($o, $r->validated('entries')); return ApiResponse::data(['status' => $o->grade_status->value]); }
    public function components(ComponentsRequest $r, int $id, OfferingAccess $a, GradeBookService $s) { return ApiResponse::data(AcademicResource::collection($s->components($a->find($r->user(), $id), $r->validated('components')))); }
    public function status(GradeStatusRequest $r, int $id, OfferingAccess $a, GradeBookService $s) { $s->transition($a->find($r->user(), $id), $r->validated('status'), $r->user()->role === Role::Admin); return ApiResponse::data(['status' => $r->validated('status')]); }
}
