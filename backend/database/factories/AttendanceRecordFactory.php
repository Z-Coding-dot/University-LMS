<?php

namespace Database\Factories;

use App\Models\AttendanceRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceRecordFactory extends Factory
{
    protected $model = AttendanceRecord::class;
    public function definition(): array { return ['session_id' => \App\Models\AttendanceSession::factory(), 'student_id' => \App\Models\User::factory()->student(), 'status' => 'present']; }
}
