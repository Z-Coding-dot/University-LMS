<?php
namespace App\Http\Controllers\Api\V1\Course;
use App\Http\Controllers\Controller;
use App\Http\Resources\{CourseResource, UserResource};
use App\Enums\Role;
use App\Models\User;
use App\Services\Academic\{OfferingAccess, CourseService, SemesterService};
use App\Services\Content\AnnouncementService;
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class CourseController extends Controller
{
    public function index(Request $r, CourseService $s) {
        $r->validate(['semester_id' => ['sometimes', 'integer', 'min:1']]);
        $rows = $s->scope($r->user(), $r->filled('semester_id') ? $r->integer('semester_id') : null)->get()->map(fn ($o) => ['view' => new CourseResource($o), 'name' => $o->course->{'name_'.app()->getLocale()}, 'code' => $o->course->code, 'credits' => $o->course->credits, 'teacher' => $o->teacher->name]);
        return ApiResponse::page((new ListQuery($r))->collection($rows, ['name', 'code', 'credits', 'teacher'], 'name'), fn ($row) => $row['view']);
    }
    public function show(Request $r, int $id, OfferingAccess $a, CourseService $s) { return ApiResponse::data($s->detail($a->find($r->user(), $id), $r)); }
    public function roster(Request $r, int $id, OfferingAccess $a) { $o = $a->find($r->user(), $id); abort_if($r->user()->role === Role::Student, 403); return ApiResponse::page((new ListQuery($r))->paginate(User::whereIn('id', $o->enrollments()->select('student_id')), ['name' => 'name', 'email' => 'email', 'institutional_id' => 'institutional_id'], 'name'), fn ($u) => new UserResource($u)); }
    public function breakdown(Request $r, int $id, OfferingAccess $a, CourseService $s) { $o = $a->find($r->user(), $id); abort_unless($r->user()->role === Role::Student, 403); return ApiResponse::page((new ListQuery($r))->collection($s->breakdown($o, $r->user()->id), ['title', 'kind', 'week_number', 'weight', 'score']), fn ($row) => $row); }
    public function weeks(Request $r, int $id, OfferingAccess $a, SemesterService $s) {
        $o = $a->find($r->user(), $id); $notices = app(AnnouncementService::class)->visible($r->user())->where('offering_id', $id)->get();
        return ApiResponse::data(['current_week' => $s->week($o->semester), 'course_announcement_count' => $notices->whereNull('week_number')->count(), 'weeks' => collect(range(1, config('lms.weeks')))->map(fn ($w) => ['week_number' => $w, 'lecture_count' => $o->lectures->where('week_number', $w)->count(), 'assignment_count' => $o->assignments->where('week_number', $w)->count(), 'announcement_count' => $notices->where('week_number', $w)->count()])]);
    }
}
