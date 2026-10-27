<?php
namespace App\Http\Controllers\Api\V1\Announcement;
use App\Http\Controllers\Controller;
use App\Http\Requests\AnnouncementRequest;
use App\Http\Resources\AcademicResource;
use App\Services\Academic\OfferingAccess;
use App\Services\Content\{AnnouncementService, ContentService};
use App\Support\{ApiResponse, ListQuery, AcademicValidation as V};
use Illuminate\Http\Request;
class AnnouncementController extends Controller
{
    public function index(Request $r, AnnouncementService $s, OfferingAccess $access) {
        $r->validate(['offering_id' => ['sometimes', 'integer', 'min:1'], 'week_number' => ['sometimes', 'integer', 'between:1,16'], 'course_wide' => ['sometimes', 'in:0,1']]); V::check(!$r->filled('week_number') || !$r->boolean('course_wide'), 'week_number');
        if ($r->filled('offering_id')) $access->find($r->user(), $r->integer('offering_id'));
        $rows = $s->visible($r->user())->when($r->filled('offering_id'), fn ($q) => $q->where('offering_id', $r->integer('offering_id')))->when($r->filled('week_number'), fn ($q) => $q->where('week_number', $r->integer('week_number')))->when($r->boolean('course_wide'), fn ($q) => $q->whereNull('week_number'))->get()->map(fn ($a) => (new AcademicResource($a))->resolve($r) + ['author_name' => $a->author->name]);
        return ApiResponse::page((new ListQuery($r))->collection($rows, ['title', 'created_at', 'author_name'], '-created_at'), fn ($row) => $row);
    }
    public function store(AnnouncementRequest $r, ContentService $s) { return ApiResponse::data(new AcademicResource($s->announcement($r->user(), $r->validated(), null)), 201); }
    public function update(AnnouncementRequest $r, int $id, ContentService $s) { return ApiResponse::data(new AcademicResource($s->announcement($r->user(), $r->validated(), $id))); }
}
