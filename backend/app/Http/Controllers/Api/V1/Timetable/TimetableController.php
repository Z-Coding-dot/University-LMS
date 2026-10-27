<?php
namespace App\Http\Controllers\Api\V1\Timetable;
use App\Http\Controllers\Controller;
use App\Enums\{Role, Permission};
use App\Models\AcademicSetting;
use App\Services\Academic\CourseService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
class TimetableController extends Controller
{
    public function __invoke(Request $r, CourseService $s) { abort_if($r->user()->role === Role::Teacher && !$r->user()->hasPermission(Permission::ViewTimetable), 403); $r->validate(['semester_id' => ['sometimes', 'integer', 'min:1']]); return ApiResponse::data(['slots' => $s->scope($r->user(), $r->filled('semester_id') ? $r->integer('semester_id') : null)->get()->flatMap(fn ($o) => $o->schedule->map(fn ($slot) => ['id' => $slot->id, 'offering_id' => $o->id, 'weekday' => $slot->weekday, 'start' => substr($slot->start, 0, 5), 'end' => substr($slot->end, 0, 5), 'room' => $slot->room, 'title' => $o->course->{'name_'.app()->getLocale()}, 'teacher' => $o->teacher->name]))->values(), 'weekend_days' => AcademicSetting::findOrFail(1)->weekend_days]); }
}
