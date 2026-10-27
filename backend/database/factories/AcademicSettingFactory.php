<?php

namespace Database\Factories;

use App\Models\AcademicSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

class AcademicSettingFactory extends Factory
{
    protected $model = AcademicSetting::class;
    public function definition(): array { return ['id' => 1, 'pass_mark' => 55, 'letter_scale' => [['min' => 55, 'max' => 100, 'letter' => 'P'], ['min' => 0, 'max' => 55, 'letter' => 'F']], 'attendance_counted_statuses' => ['present', 'late', 'excused'], 'attendance_warning_threshold' => 75, 'weekend_days' => [5]]; }
}
