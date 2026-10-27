<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class AccountStatusRequest extends AccountMutationRequest
{
    public function rules(): array { return ['status' => ['required', Rule::in(['active', 'inactive'])]]; }
}
