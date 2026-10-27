<?php

namespace Database\Factories;

use App\Models\Submission;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubmissionFactory extends Factory
{
    protected $model = Submission::class;
    public function definition(): array { return ['assignment_id' => \App\Models\Assignment::factory(), 'student_id' => \App\Models\User::factory()->student(), 'submitted_at' => now(), 'score' => null, 'feedback' => null]; }
}
