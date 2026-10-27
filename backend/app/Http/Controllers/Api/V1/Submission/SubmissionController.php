<?php
namespace App\Http\Controllers\Api\V1\Submission;
use App\Http\Controllers\Controller;
use App\Http\Requests\{SubmissionRequest, SubmissionGradeRequest};
use App\Http\Resources\AcademicResource;
use App\Enums\Permission;
use App\Models\Assignment;
use App\Services\Academic\OfferingAccess;
use App\Services\Content\ContentService;
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class SubmissionController extends Controller
{
    public function index(Request $r, int $id, OfferingAccess $access) { $a = Assignment::findOrFail($id); $access->find($r->user(), $a->offering_id, Permission::ManageAssignments); $rows = $a->submissions()->with(['student', 'files'])->get()->map(fn ($s) => (new AcademicResource($s))->resolve($r) + ['student_name' => $s->student->name]); return ApiResponse::page((new ListQuery($r))->collection($rows, ['student_name', 'submitted_at', 'score'], '-submitted_at'), fn ($row) => $row); }
    public function store(SubmissionRequest $r, int $id, ContentService $s) { return ApiResponse::data(new AcademicResource($s->submit($r->user(), $id, $r->validated('file_ids'))), 201); }
    public function update(SubmissionGradeRequest $r, int $id, ContentService $s) { return ApiResponse::data(new AcademicResource($s->grade($id, $r->validated()))); }
}
