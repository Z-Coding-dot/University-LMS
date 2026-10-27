<?php
namespace App\Services\Content;
use App\Models\{Announcement, User};
use App\Enums\Role;
use App\Services\Academic\OfferingAccess;
class AnnouncementService
{
    public function visible(User $u, ?array $offeringIds = null) {
        $ids = $offeringIds ?? app(OfferingAccess::class)->scoped($u)->pluck('id')->all();
        return Announcement::with('author')->when($u->role !== Role::Admin, fn ($q) => $q->where(fn ($q) => $q->where('audience', 'all')->orWhere(fn ($q) => $q->where('audience', 'role')->where('role', $u->role->value))->orWhere(fn ($q) => $q->where('audience', 'offering')->whereIn('offering_id', $ids))));
    }
}
