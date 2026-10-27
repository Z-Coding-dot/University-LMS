<?php
namespace App\Http\Controllers\Api\V1\Lecture;
use App\Http\Controllers\Controller;
use App\Http\Requests\LectureRequest;
use App\Http\Resources\AcademicResource;
use App\Services\Academic\OfferingAccess;
use App\Services\Content\ContentService;
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class LectureController extends Controller
{
    public function index(Request $r, int $id, OfferingAccess $a) { $o = $a->find($r->user(), $id); $r->validate(['week_number' => ['sometimes', 'integer', 'between:1,16']]); $rows = $o->lectures()->with('attachments')->when($r->filled('week_number'), fn ($q) => $q->where('week_number', $r->integer('week_number')))->get()->map(fn ($l) => (new AcademicResource($l))->resolve($r)); return ApiResponse::page((new ListQuery($r))->collection($rows, ['title', 'week_number', 'updated_at'], '-updated_at'), fn ($row) => $row); }
    public function store(LectureRequest $r, int $id, ContentService $s) { return ApiResponse::data(new AcademicResource($s->teaching($r->user(), $r->validated(), 'lecture', null, $id)), 201); }
    public function update(LectureRequest $r, int $id, int $lectureId, ContentService $s) { \App\Models\Lecture::where('offering_id', $id)->findOrFail($lectureId); return ApiResponse::data(new AcademicResource($s->teaching($r->user(), $r->validated(), 'lecture', $lectureId, $id))); }
}
