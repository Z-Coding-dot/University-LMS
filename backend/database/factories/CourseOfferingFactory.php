<?php

namespace Database\Factories;

use App\Models\CourseOffering;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseOfferingFactory extends Factory
{
    protected $model = CourseOffering::class;
    public function definition(): array { return ['course_id' => \App\Models\Course::factory(), 'semester_id' => \App\Models\Semester::factory(), 'teacher_id' => \App\Models\User::factory()->teacher(), 'capacity' => 30, 'grade_status' => 'draft']; }
}
