<?php

namespace Database\Factories;

use App\Models\AttendanceSession;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceSessionFactory extends Factory
{
    protected $model = AttendanceSession::class;
    public function definition(): array { return ['offering_id' => \App\Models\CourseOffering::factory(), 'date' => '2026-10-20']; }
}
