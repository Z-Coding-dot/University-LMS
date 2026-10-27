<?php
namespace App\Http\Controllers\Api\V1\Attendance;
use App\Http\Controllers\Controller;
use App\Http\Requests\AttendanceRequest;
use App\Http\Resources\{UserResource, AcademicResource};
use App\Enums\Role;
use App\Models\User;
use App\Services\Academic\{OfferingAccess, AttendanceService};
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class AttendanceController extends Controller
{
    public function show(Request $r, int $id, OfferingAccess $a) { $o = $a->find($r->user(), $id); abort_if($r->user()->role === Role::Student, 403); $sessions = $o->attendanceSessions()->with('records')->orderByDesc('date')->get(); return ApiResponse::data(['students' => UserResource::collection(User::whereIn('id', $o->enrollments()->select('student_id'))->get()), 'sessions' => AcademicResource::collection($sessions), 'records' => AcademicResource::collection($sessions->flatMap->records)]); }
    public function store(AttendanceRequest $r, int $id, OfferingAccess $a, AttendanceService $s) { return ApiResponse::data(new AcademicResource($s->save($a->find($r->user(), $id), $r->validated()))); }
    public function history(Request $r, int $id, OfferingAccess $a) { $o = $a->find($r->user(), $id); abort_unless($r->user()->role === Role::Student, 403); $rows = $o->attendanceSessions()->with(['records' => fn ($q) => $q->where('student_id', $r->user()->id)])->get()->map(fn ($s) => ['id' => $s->id, 'date' => $s->date->toDateString(), 'status' => $s->records->first()?->status->value]); return ApiResponse::page((new ListQuery($r))->collection($rows, ['date', 'status'], '-date'), fn ($row) => $row); }
}
