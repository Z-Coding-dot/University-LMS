<?php

namespace App\Support;

use Illuminate\Validation\Validator;

final class StrictPayload
{
    public static function check(Validator $validator, array $input, array $allowed): void
    {
        foreach (array_diff(array_keys($input), $allowed) as $key) {
            $validator->errors()->add((string) $key, __('validation.unknown'));
        }
    }
}
