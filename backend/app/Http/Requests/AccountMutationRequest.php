<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\Digits;

abstract class AccountMutationRequest extends StrictFormRequest
{
    protected function prepareForValidation(): void
    {
        if ($id = $this->route('id')) $this->attributes->set('account', User::where('role', $this->route('managed_role'))->findOrFail($id));
        if (is_string($this->input('email'))) $this->merge(['email' => mb_strtolower(trim(Digits::normalize($this->input('email'))))]);
        if (is_string($this->input('name'))) $this->merge(['name' => trim($this->input('name'))]);
    }
    public function target(): User { return $this->attributes->get('account'); }
}
