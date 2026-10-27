<?php

namespace Database\Factories;

use App\Models\GradeEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

class GradeEntryFactory extends Factory
{
    protected $model = GradeEntry::class;
    public function definition(): array { return ['component_id' => \App\Models\GradeComponent::factory(), 'student_id' => \App\Models\User::factory()->student(), 'score' => 75, 'feedback' => null]; }
}
