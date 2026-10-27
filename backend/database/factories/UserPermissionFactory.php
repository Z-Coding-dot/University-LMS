<?php

namespace Database\Factories;

use App\Models\UserPermission;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserPermissionFactory extends Factory
{
    protected $model = UserPermission::class;
    public function definition(): array { return ['user_id' => \App\Models\User::factory()->teacher(), 'permission' => 'grades.enter']; }
}
