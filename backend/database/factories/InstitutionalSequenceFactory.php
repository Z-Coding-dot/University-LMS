<?php

namespace Database\Factories;

use App\Models\InstitutionalSequence;
use Illuminate\Database\Eloquent\Factories\Factory;

class InstitutionalSequenceFactory extends Factory
{
    protected $model = InstitutionalSequence::class;
    public function definition(): array { return ['prefix' => 'ST', 'number' => 0]; }
}
