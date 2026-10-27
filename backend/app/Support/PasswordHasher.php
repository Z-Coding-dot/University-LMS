<?php

namespace App\Support;

use Illuminate\Hashing\BcryptHasher;

/** SHA-256 prehash preserves the full 128-character contract beyond bcrypt's 72-byte limit. */
class PasswordHasher extends BcryptHasher
{
    public function make(#[\SensitiveParameter] $value, array $options = [])
    {
        return parent::make(hash('sha256', $value), $options);
    }
    public function check(#[\SensitiveParameter] $value, $hashedValue, array $options = [])
    {
        return parent::check(hash('sha256', $value), $hashedValue, $options);
    }
}
