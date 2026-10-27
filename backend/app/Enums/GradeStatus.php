<?php

namespace App\Enums;

enum GradeStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Locked = 'locked';
}
