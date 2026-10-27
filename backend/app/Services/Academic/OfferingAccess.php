<?php

namespace App\Services\Academic;

use App\Enums\{Role, Permission};
use App\Models\{CourseOffering, User};
use Illuminate\Database\Eloquent\Builder;

class OfferingAccess
{
    public function scoped(User $user): Builder
    {
        return CourseOffering::query()->when($user->role === Role::Teacher, fn ($q) => $q->where('teacher_id', $user->id))
            ->when($user->role === Role::Student, fn ($q) => $q->whereHas('enrollments', fn ($e) => $e->where('student_id', $user->id)));
    }

    public function find(User $user, int $id, ?Permission $permission = null): CourseOffering
    {
        $offering = CourseOffering::findOrFail($id);
        $allowed = match ($user->role) {
            Role::Admin => true,
            Role::Teacher => $offering->teacher_id === $user->id,
            Role::Student => $offering->enrollments()->where('student_id', $user->id)->exists(),
        };
        abort_unless($allowed && ($permission === null || $user->hasPermission($permission)), 403);
        return $offering;
    }
}
