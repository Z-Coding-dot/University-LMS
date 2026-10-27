<?php

namespace App\Http\Requests;

use App\Enums\Role;

class PasswordRequest extends StrictFormRequest
{
    public function authorize(): bool { return $this->user()->role === Role::Admin; }
    public function rules(): array
    {
        return ['current_password' => ['present', 'string', 'min:1', 'max:128'], 'password' => ['present', 'string', 'between:8,128', 'confirmed', 'different:current_password'], 'password_confirmation' => ['present', 'string', 'min:1', 'max:128']];
    }
}
