<?php

namespace App\Support;

final class Digits
{
    public static function normalize(string $value): string
    {
        $map = [];
        for ($digit = 0; $digit < 10; $digit++) {
            $map[mb_chr(0x6f0 + $digit)] = (string) $digit;
            $map[mb_chr(0x660 + $digit)] = (string) $digit;
        }
        return strtr($value, $map);
    }
}
