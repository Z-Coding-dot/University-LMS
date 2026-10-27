<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

class AcademicYearFactory extends Factory
{
    protected $model = AcademicYear::class;
    public function definition(): array { return ['name' => fake()->unique()->numerify('Year ####'), 'starts_at' => '2026-01-01', 'ends_at' => '2026-12-31']; }
}
