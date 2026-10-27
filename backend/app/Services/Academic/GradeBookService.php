<?php
namespace App\Services\Academic;
use App\Enums\GradeStatus;
use App\Models\{CourseOffering, GradeEntry};
use App\Support\AcademicValidation as V;
use Illuminate\Support\Facades\DB;
class GradeBookService
{
    public function save(CourseOffering $offering, array $rows): void {
        DB::transaction(function () use ($offering, $rows) {
            $o = CourseOffering::whereKey($offering->id)->lockForUpdate()->firstOrFail(); abort_if($o->grade_status === GradeStatus::Locked, 403);
            $ids = $o->enrollments()->pluck('student_id')->all(); $cs = $o->components->keyBy('id'); $keys = [];
            foreach ($rows as $row) {
                $key = $row['student_id'].':'.$row['component_id']; $c = $cs->get($row['component_id']);
                V::check(!isset($keys[$key]) && in_array((int) $row['student_id'], $ids, true) && $c && is_finite((float) $row['score']) && $row['score'] <= $c->max_score, 'entries'); $keys[$key] = true;
                GradeEntry::updateOrCreate(['student_id' => $row['student_id'], 'component_id' => $row['component_id']], ['score' => $row['score'], 'feedback' => $row['feedback'] ?? null]);
            }
        });
    }
    public function components(CourseOffering $offering, array $rows) {
        return DB::transaction(function () use ($offering, $rows) {
            $o = CourseOffering::whereKey($offering->id)->lockForUpdate()->firstOrFail(); abort_unless($o->grade_status === GradeStatus::Draft, 403);
            V::check(abs(collect($rows)->sum('weight') - 100) <= 0.000001, 'components'); $cs = $o->components->keyBy('id'); $keep = [];
            foreach ($rows as $row) {
                V::check(is_finite((float) $row['max_score']) && is_finite((float) $row['weight']), 'components');
                if (isset($row['id'])) { $c = $cs->get($row['id']); V::check($c !== null && !in_array($row['id'], $keep), 'components'); V::check(!$c->entries()->where('score', '>', $row['max_score'])->exists(), 'components'); $keep[] = $row['id']; }
            }
            // Allocate new IDs before removing old components, also safe on SQLite without AUTOINCREMENT reuse.
            foreach ($rows as $row) { $id = $row['id'] ?? null; unset($row['id']); $d = V::attributes($row); if ($id) $cs[$id]->update($d); else $keep[] = $o->components()->create($d)->id; }
            $o->components()->whereNotIn('id', $keep)->delete(); return $o->components()->orderBy('id')->get();
        });
    }
    public function transition(CourseOffering $offering, string $status, bool $admin): void {
        DB::transaction(function () use ($offering, $status, $admin) {
            $o = CourseOffering::whereKey($offering->id)->lockForUpdate()->firstOrFail(); $from = $o->grade_status->value;
            if ($from === 'locked' && $status === 'published') abort_unless($admin, 403);
            V::check(in_array($from.':'.$status, ['draft:published', 'published:locked', 'locked:published'], true), 'status');
            if ($from === 'draft') {
                V::check($o->components->isNotEmpty() && abs($o->components->sum('weight') - 100) <= 0.000001, 'status');
                foreach ($o->enrollments as $e) V::check(app(GradingService::class)->total($o->components, $o->components->flatMap(fn ($c) => $c->entries->where('student_id', $e->student_id))) !== null, 'status');
            }
            $o->update(['grade_status' => $status]); GradeEntry::whereIn('component_id', $o->components->pluck('id'))->update(['updated_at' => now()]);
        });
    }
}
