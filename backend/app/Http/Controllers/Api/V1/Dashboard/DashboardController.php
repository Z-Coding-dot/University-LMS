<?php
namespace App\Http\Controllers\Api\V1\Dashboard;
use App\Http\Controllers\Controller;
use App\Enums\{Role, Permission};
use App\Services\Dashboard\DashboardService;
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class DashboardController extends Controller
{
    public function index(Request $r, DashboardService $s) { $this->validateQuery($r); return ApiResponse::data($s->build($r)['summary']); }
    private function validateQuery(Request $r): void { $r->validate(['offering_id' => ['sometimes', 'integer', 'min:1'], 'search' => ['sometimes', 'nullable', 'string', 'max:200'], 'attention_only' => ['sometimes', 'in:0,1']]); }
    public function feed(Request $r, DashboardService $s) {
        $feed = $r->route('feed'); $u = $r->user();
        if (in_array($feed, ['work', 'submissions', 'grades'], true)) {
            abort_if($u->role === Role::Student, 403);
            $grade = $u->hasPermission(Permission::EnterGrades) || $u->hasPermission(Permission::PublishGrades);
            abort_unless(match ($feed) { 'submissions' => $u->hasPermission(Permission::ManageAssignments), 'grades' => $grade, 'work' => $grade || $u->hasPermission(Permission::TakeAttendance) }, 403);
        }
        $this->validateQuery($r); $rows = $s->build($r)[$feed];
        if ($feed === 'tasks' && $r->boolean('attention_only')) $rows = $rows->whereIn('status', ['pending', 'overdue', 'review']);
        [$fields, $sort] = match ($feed) {
            'tasks' => [['title', 'due_at', 'course', 'status', 'submission_rate'], 'due_at'],
            'files' => [['name', 'course', 'uploaded_at'], '-uploaded_at'],
            'work' => [['course', 'kind', 'date', 'pending'], '-date'],
            'submissions' => [['title', 'course', 'student_name', 'submitted_at', 'score'], '-submitted_at'],
            'grades' => [['course', 'student_name', 'updated_at', 'score'], '-updated_at'],
            default => abort(404),
        };
        return ApiResponse::page((new ListQuery($r))->collection($rows, $fields, $sort, $feed === 'tasks' ? ['title', 'description', 'course'] : null), fn ($row) => $row);
    }
}
