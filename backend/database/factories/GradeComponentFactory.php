<?php

namespace Database\Factories;

use App\Models\GradeComponent;
use Illuminate\Database\Eloquent\Factories\Factory;

class GradeComponentFactory extends Factory
{
    protected $model = GradeComponent::class;
    public function definition(): array { return ['offering_id' => \App\Models\CourseOffering::factory(), 'name_fa' => 'Final', 'name_en' => 'Final', 'max_score' => 100, 'weight' => 100]; }
}
