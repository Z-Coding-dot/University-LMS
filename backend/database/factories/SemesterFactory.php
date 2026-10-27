<?php

namespace Database\Factories;

use App\Models\Semester;
use Illuminate\Database\Eloquent\Factories\Factory;

class SemesterFactory extends Factory
{
    protected $model = Semester::class;
    public function definition(): array { return ['academic_year_id' => \App\Models\AcademicYear::factory(), 'name_fa' => 'Semester', 'name_en' => 'Semester', 'starts_at' => '2026-09-01', 'ends_at' => '2026-12-31']; }
}
