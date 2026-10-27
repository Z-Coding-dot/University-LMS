<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Controller;
use App\Http\Requests\StructureRequest;
use App\Http\Resources\StructureResource;
use App\Services\Academic\StructureService;
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class StructureController extends Controller
{
    public function index(Request $r, string $resource, StructureService $s) { $class = $s->model($resource); return ApiResponse::page((new ListQuery($r))->paginate($class::query(), ['id' => 'id', 'name' => $resource === 'academic-years' ? 'name' : 'name_'.app()->getLocale()], 'name'), fn ($row) => new StructureResource($row)); }
    public function store(StructureRequest $r, string $resource, StructureService $s) { return ApiResponse::data(new StructureResource($s->save($resource, null, $r->validated())), 201); }
    public function update(StructureRequest $r, string $resource, int $id, StructureService $s) { return ApiResponse::data(new StructureResource($s->save($resource, $id, $r->validated()))); }
    public function destroy(\App\Http\Requests\DeleteAcademicRequest $request, string $resource, int $id, StructureService $s) { $s->delete($resource, $id); return response()->noContent(); }
}
