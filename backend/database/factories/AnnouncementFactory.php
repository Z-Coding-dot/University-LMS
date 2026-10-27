<?php

namespace Database\Factories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;
    public function definition(): array { return ['title' => fake()->sentence(), 'body' => fake()->paragraph(), 'audience' => 'all', 'role' => null, 'offering_id' => null, 'week_number' => null, 'author_id' => \App\Models\User::factory()->admin()]; }
}
