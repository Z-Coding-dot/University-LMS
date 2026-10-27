<?php

namespace App\Enums;

enum Audience: string
{
    case All = 'all';
    case Role = 'role';
    case Offering = 'offering';
}
