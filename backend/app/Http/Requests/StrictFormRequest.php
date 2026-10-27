<?php

namespace App\Http\Requests;

use App\Support\StrictPayload;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

abstract class StrictFormRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function withValidator(Validator $validator): void
    {
        $allowed = array_unique(array_map(fn ($key) => explode('.', $key)[0], array_keys($this->rules())));
        $validator->after(fn (Validator $v) => StrictPayload::check($v, $this->all(), $allowed));
    }
}
