<?php
namespace App\Http\Controllers\Api\V1\Result;
use App\Http\Controllers\Controller;
use App\Http\Resources\StructureResource;
use App\Enums\Role;
use App\Services\Academic\{OfferingAccess, CourseService, GradingService};
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;
class ResultController extends Controller
{
    public function index(Request $r, OfferingAccess $a, CourseService $s, GradingService $g) {
        abort_unless($r->user()->role === Role::Student, 403);
        $rows = $a->scoped($r->user())->with(['course', 'semester', 'components.entries', 'assignments.submissions'])->get();
        if ($r->is('*/results/courses')) { $r->validate(['semester_id' => ['required', 'integer', 'min:1']]); return ApiResponse::page((new ListQuery($r))->collection($rows->where('semester_id', $r->integer('semester_id'))->map(fn ($o) => $s->result($o, $r->user()->id)), ['name', 'code', 'credits', 'total']), fn ($row) => $row); }
        $semesters = $rows->groupBy('semester_id')->map(function ($os) use ($s, $r, $g) { $courses = $os->map(fn ($o) => $s->result($o, $r->user()->id)); return ['semester' => new StructureResource($os->first()->semester), 'courses' => $courses, 'average' => $g->average($courses)]; })->values();
        return ApiResponse::data(['semesters' => $semesters, 'cumulative_average' => $g->average($semesters->flatMap(fn ($row) => $row['courses']))]);
    }
}
