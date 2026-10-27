<?php

namespace App\Http\Requests;

use App\Enums\Role;
use Illuminate\Validation\Rule;

class ProfileRequest extends StrictFormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === Role::Admin || !array_intersect(['name', 'email', 'password', 'current_password', 'password_confirmation'], array_keys($this->all()));
    }
    public function rules(): array
    {
        return ['locale' => ['required', Rule::in(['fa', 'en'])], 'name' => ['sometimes', 'required', 'string', 'between:2,100']];
    }
}
