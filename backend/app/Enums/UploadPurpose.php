<?php

namespace App\Enums;

enum UploadPurpose: string
{
    case Submission = 'submission';
    case Assignment = 'assignment';
    case Lecture = 'lecture';
}
