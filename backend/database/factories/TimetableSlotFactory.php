<?php

namespace Database\Factories;

use App\Models\TimetableSlot;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimetableSlotFactory extends Factory
{
    protected $model = TimetableSlot::class;
    public function definition(): array { return ['offering_id' => \App\Models\CourseOffering::factory(), 'weekday' => 1, 'start' => '08:00', 'end' => '09:00', 'room' => fake()->numerify('Room ###')]; }
}
