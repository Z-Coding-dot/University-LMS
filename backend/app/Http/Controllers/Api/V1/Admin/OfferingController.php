<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Controller;
use App\Http\Requests\{OfferingRequest, ScheduleRequest, EnrollmentRequest};
use App\Http\Resources\{CourseResource, UserResource};
use App\Models\{CourseOffering, User, Semester};
use App\Services\Academic\{ScheduleConflictService, EnrollmentService};
use App\Support\{ApiResponse, ListQuery, AcademicValidation as V};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class OfferingController extends Controller
{
    public function index(Request $r) {
        $r->validate(['semester_id' => ['sometimes', 'integer', 'min:1'], 'teacher_id' => ['sometimes', 'integer', 'min:1']]);
        $q = CourseOffering::with(['course', 'semester', 'teacher', 'schedule'])->withCount('enrollments');
        foreach (['semester_id', 'teacher_id'] as $f) if ($r->filled($f)) $q->where($f, $r->integer($f));
        if ($r->routeIs('admin.locked')) $q->where('grade_status', 'locked');
        $rows = $q->get()->map(fn ($o) => ['view' => new CourseResource($o), 'name' => $o->course->{'name_'.app()->getLocale()}, 'teacher' => $o->teacher->name, 'capacity' => $o->capacity, 'student_count' => $o->enrollments_count]);
        return ApiResponse::page((new ListQuery($r))->collection($rows, ['name', 'teacher', 'capacity', 'student_count'], 'name'), fn ($a) => $a['view']);
    }
    public function store(OfferingRequest $r) { return $this->save($r, null); }
    public function update(OfferingRequest $r, int $id) { return $this->save($r, $id); }
    private function save(OfferingRequest $r, ?int $id) {
        $o = DB::transaction(function () use ($r, $id) {
            $d = $r->validated();
            $existing = $id ? CourseOffering::findOrFail($id) : null;
            if ($existing) V::check($existing->course_id === (int) $d['course_id'] && $existing->semester_id === (int) $d['semester_id'], 'course_id');
            Semester::whereKey($d['semester_id'])->lockForUpdate()->firstOrFail();
            $o = $existing ? CourseOffering::whereKey($id)->lockForUpdate()->firstOrFail() : new CourseOffering;
            V::check(!$id || $o->enrollments()->count() <= $d['capacity'], 'capacity', 'capacity_exceeded');
            $o->fill($d);
            if ($id) app(ScheduleConflictService::class)->validate($o, $o->schedule->toArray());
            $o->save(); return $o->fresh();
        });
        return ApiResponse::data(new CourseResource($o), $id ? 200 : 201);
    }
    public function destroy(\App\Http\Requests\DeleteAcademicRequest $request, int $id) { DB::transaction(function () use ($id) { $o = app(ScheduleConflictService::class)->lock(CourseOffering::findOrFail($id)); foreach (['enrollments', 'attendanceSessions', 'components', 'assignments', 'lectures', 'announcements'] as $rel) V::check(!$o->$rel()->exists(), 'record', 'record_in_use'); $o->delete(); }); return response()->noContent(); }
    public function candidates(Request $r, int $id) { CourseOffering::findOrFail($id); $q = User::where('role', 'student')->where('status', 'active')->whereDoesntHave('enrollments', fn ($q) => $q->where('offering_id', $id)); return ApiResponse::page((new ListQuery($r))->paginate($q, ['name' => 'name', 'email' => 'email', 'institutional_id' => 'institutional_id'], 'name'), fn ($u) => new UserResource($u)); }
    public function enrollments(EnrollmentRequest $r, int $id, EnrollmentService $s) { return ApiResponse::data(new CourseResource($s->add(CourseOffering::findOrFail($id), $r->validated()))); }
    public function schedule(ScheduleRequest $r, int $id, ScheduleConflictService $s) { $o = DB::transaction(function () use ($r, $id, $s) { $o = $s->lock(CourseOffering::findOrFail($id)); $s->validate($o, $r->validated('slots')); $o->schedule()->delete(); $o->schedule()->createMany($r->validated('slots')); return $o->fresh(); }); return ApiResponse::data(new CourseResource($o)); }
}
