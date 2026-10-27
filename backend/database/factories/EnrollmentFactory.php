<?php

namespace Database\Factories;

use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnrollmentFactory extends Factory
{
    protected $model = Enrollment::class;
    public function definition(): array { return ['offering_id' => \App\Models\CourseOffering::factory(), 'student_id' => \App\Models\User::factory()->student()]; }
}
