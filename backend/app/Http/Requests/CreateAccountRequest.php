<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class CreateAccountRequest extends AccountMutationRequest
{
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'between:2,100'], 'email' => ['required', 'string', 'email', 'max:254', Rule::unique('users', 'email')], 'locale' => ['required', Rule::in(['fa', 'en'])]];
    }
}
