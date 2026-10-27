<?php
namespace App\Services\Academic;
use App\Enums\{GradeStatus, Role};
use App\Models\{AcademicSetting, CourseOffering};
use App\Support\AcademicValidation as V;
class GradingService
{
    public function validScale(array $scale): bool
    {
        usort($scale, fn ($a, $b) => $a['min'] <=> $b['min']); $end = 0.0;
        foreach ($scale as $r) { if (abs($r['min'] - $end) > 0.000001 || $r['max'] <= $r['min']) return false; $end = (float) $r['max']; }
        return count($scale) > 0 && abs($end - 100) <= 0.000001;
    }
    public function total(iterable $components, iterable $entries): ?float
    {
        $cs = collect($components); $es = collect($entries)->keyBy('component_id');
        if ($cs->isEmpty() || abs($cs->sum('weight') - 100) > 0.000001) return null;
        $sum = 0.0;
        foreach ($cs as $c) { $e = $es->get(data_get($c, 'id')); if ($e === null || data_get($e, 'score') === null || data_get($c, 'max_score') <= 0) return null; $sum += data_get($e, 'score') / data_get($c, 'max_score') * data_get($c, 'weight'); }
        return $sum;
    }
    public function average(iterable $rows): ?float
    {
        $sum = 0.0; $credits = 0.0;
        foreach ($rows as $r) if (data_get($r, 'total') !== null && data_get($r, 'credits') > 0) { $sum += data_get($r, 'total') * data_get($r, 'credits'); $credits += data_get($r, 'credits'); }
        return $credits ? $sum / $credits : null;
    }
    public function letter(?float $total, ?array $scale = null): ?string
    {
        if ($total === null) return null;
        foreach ($scale ?? AcademicSetting::findOrFail(1)->letter_scale as $r) if ($total >= $r['min'] && ($total < $r['max'] || ($r['max'] == 100 && $total <= 100))) return $r['letter'];
        return null;
    }
    public function studentTotal(CourseOffering $o, int $student): ?float { return $o->grade_status === GradeStatus::Draft ? null : $this->total($o->components, $o->components->flatMap(fn ($c) => $c->entries->where('student_id', $student))); }
}
