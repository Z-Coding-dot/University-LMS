<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicSetting extends Model
{
    use HasFactory;

    protected $fillable = ['id', 'pass_mark', 'letter_scale', 'attendance_counted_statuses', 'attendance_warning_threshold', 'weekend_days'];
    protected function casts(): array { return ['pass_mark' => 'float', 'letter_scale' => 'array', 'attendance_counted_statuses' => 'array', 'attendance_warning_threshold' => 'float', 'weekend_days' => 'array']; }
}
