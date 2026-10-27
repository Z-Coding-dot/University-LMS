<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    protected $model = User::class;
    protected static ?string $password = null;
    public function definition(): array
    {
        return ['name' => fake()->name(), 'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('TestPassword123!'),
            'role' => Role::Student, 'status' => 'active', 'locale' => 'en', 'must_change_password' => false,
            'institutional_id' => 'ST-'.fake()->unique()->numberBetween(100000, 999999999),
            'department_id' => null, 'current_semester_id' => null];
    }
    public function admin(): static { return $this->state(fn () => ['role' => Role::Admin, 'institutional_id' => 'AD-'.fake()->unique()->numberBetween(100000, 999999999)]); }
    public function teacher(): static { return $this->state(fn () => ['role' => Role::Teacher, 'institutional_id' => 'TC-'.fake()->unique()->numberBetween(100000, 999999999)]); }
    public function student(): static { return $this->state(['role' => Role::Student]); }
    public function inactive(): static { return $this->state(['status' => 'inactive']); }
}
