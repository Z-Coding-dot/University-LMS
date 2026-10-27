<?php

namespace Database\Factories;

use App\Models\Faculty;
use Illuminate\Database\Eloquent\Factories\Factory;

class FacultyFactory extends Factory
{
    protected $model = Faculty::class;
    public function definition(): array { return ['name_fa' => fake()->unique()->company(), 'name_en' => fake()->company()]; }
}
