<?php

namespace App\Http\Requests;

use App\Support\Digits;

class LoginRequest extends StrictFormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('identifier'))) $this->merge(['identifier' => mb_strtolower(trim(Digits::normalize($this->input('identifier'))))]);
    }
    public function rules(): array
    {
        return ['identifier' => ['required', 'string', 'email', 'max:254'], 'password' => ['present', 'string', 'min:1', 'max:128']];
    }
}
