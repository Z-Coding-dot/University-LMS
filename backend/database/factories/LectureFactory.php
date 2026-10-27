<?php

namespace Database\Factories;

use App\Models\Lecture;
use Illuminate\Database\Eloquent\Factories\Factory;

class LectureFactory extends Factory
{
    protected $model = Lecture::class;
    public function definition(): array { return ['offering_id' => \App\Models\CourseOffering::factory(), 'week_number' => 1, 'title' => fake()->sentence(), 'description' => fake()->paragraph()]; }
}
