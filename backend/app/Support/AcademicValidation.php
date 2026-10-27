<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

final class AcademicValidation
{
    public static function check(bool $valid, string $field, string $key = 'invalid_academic'): void
    {
        if (!$valid) throw ValidationException::withMessages([$field => __('messages.'.$key)]);
    }

    public static function name(): array
    {
        return ['name' => ['required', 'array:fa,en'], 'name.fa' => ['required', 'string', 'max:150'], 'name.en' => ['required', 'string', 'max:150']];
    }

    public static function attributes(array $data): array
    {
        if (is_array($data['name'] ?? null)) {
            $data['name_fa'] = $data['name']['fa']; $data['name_en'] = $data['name']['en']; unset($data['name']);
        }
        return $data;
    }
}
