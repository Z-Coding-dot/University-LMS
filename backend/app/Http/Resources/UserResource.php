<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'name' => $this->name, 'email' => $this->email,
            'role' => $this->role->value, 'permissions' => $this->resource->permissionValues(),
            'locale' => $this->locale, 'must_change_password' => $this->role === \App\Enums\Role::Admin && $this->must_change_password,
            'status' => $this->status->value,
            'profile' => ['institutional_id' => $this->institutional_id, 'department_id' => $this->department_id, 'current_semester_id' => $this->current_semester_id],
        ];
    }
}
