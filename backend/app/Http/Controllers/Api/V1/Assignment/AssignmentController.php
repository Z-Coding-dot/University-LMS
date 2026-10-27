<?php
namespace App\Http\Controllers\Api\V1\Assignment;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignmentRequest;
use App\Http\Resources\AcademicResource;
use App\Enums\Role;
use App\Models\Assignment;
use App\Services\Academic\OfferingAccess;
use App\Services\Content\ContentService;
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class AssignmentController extends Controller
{
    private function view(Assignment $a, Request $r): array { return (new AcademicResource($a))->resolve($r) + ['course_name' => ['fa' => $a->offering->course->name_fa, 'en' => $a->offering->course->name_en], 'submission' => $r->user()->role === Role::Student && ($s = $a->submissions->firstWhere('student_id', $r->user()->id)) ? new AcademicResource($s) : null, 'submission_count' => $a->submissions->count()]; }
    public function index(Request $r, OfferingAccess $access) {
        $r->validate(['offering_id' => ['sometimes', 'integer', 'min:1'], 'week_number' => ['sometimes', 'integer', 'between:1,16']]);
        if ($r->filled('offering_id')) $access->find($r->user(), $r->integer('offering_id'));
        $rows = Assignment::whereIn('offering_id', $access->scoped($r->user())->select('id'))->with(['offering.course', 'attachments', 'submissions.files'])->when($r->filled('offering_id'), fn ($q) => $q->where('offering_id', $r->integer('offering_id')))->when($r->filled('week_number'), fn ($q) => $q->where('week_number', $r->integer('week_number')))->get()->map(fn ($a) => $this->view($a, $r) + ['course' => $a->offering->course->{'name_'.app()->getLocale()}]);
        return ApiResponse::page((new ListQuery($r))->collection($rows, ['title', 'due_at', 'week_number', 'course'], 'due_at'), function ($row) { unset($row['course']); return $row; });
    }
    public function show(Request $r, int $id, OfferingAccess $access) { $a = Assignment::findOrFail($id); $access->find($r->user(), $a->offering_id); return ApiResponse::data($this->view($a, $r)); }
    public function store(AssignmentRequest $r, ContentService $s) { return ApiResponse::data(new AcademicResource($s->teaching($r->user(), $r->validated(), 'assignment')), 201); }
    public function update(AssignmentRequest $r, int $id, ContentService $s) { return ApiResponse::data(new AcademicResource($s->teaching($r->user(), $r->validated(), 'assignment', $id))); }
}
