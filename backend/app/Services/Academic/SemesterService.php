<?php

namespace App\Services\Academic;

use App\Models\{Semester, User};
use App\Enums\Role;
use Carbon\CarbonImmutable;

class SemesterService
{
    public function today(): CarbonImmutable { return CarbonImmutable::now(config('lms.timezone'))->startOfDay(); }
    public function current(): ?Semester
    {
        $today = $this->today()->toDateString();
        return Semester::where('starts_at', '<=', $today)->where('ends_at', '>=', $today)->orderByDesc('starts_at')->orderByDesc('id')->first()
            ?? Semester::where('starts_at', '<=', $today)->orderByDesc('starts_at')->orderByDesc('id')->first();
    }
    public function forUser(User $user): ?Semester { return $user->role === Role::Student ? $user->currentSemester : $this->current(); }
    public function week(Semester $semester): ?int
    {
        $day = $this->today();
        $start = CarbonImmutable::parse($semester->starts_at->toDateString(), config('lms.timezone'));
        $end = CarbonImmutable::parse($semester->ends_at->toDateString(), config('lms.timezone'));
        return $day->lt($start) || $day->gt($end) ? null : min(config('lms.weeks'), (int) floor($start->diffInDays($day) / 7) + 1);
    }
}
