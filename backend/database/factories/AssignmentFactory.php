<?php

namespace Database\Factories;

use App\Models\Assignment;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;
    public function definition(): array { return ['offering_id' => \App\Models\CourseOffering::factory(), 'week_number' => 1, 'submission_enabled' => true, 'title' => fake()->sentence(), 'description' => fake()->paragraph(), 'due_at' => now()->addWeek()]; }
}
