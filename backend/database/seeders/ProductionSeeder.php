<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\{AcademicSetting, User, InstitutionalSequence};
use App\Services\Accounts\AccountService;
use App\Support\Digits;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, Hash, Validator};
use Illuminate\Validation\Rules\Password;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // Serialize the first-admin check with its institutional ID sequence.
            InstitutionalSequence::whereKey('AD')->lockForUpdate()->firstOrFail();
            AcademicSetting::firstOrCreate(['id' => 1], [
                'pass_mark' => 55, 'attendance_warning_threshold' => 75,
                'attendance_counted_statuses' => ['present', 'late', 'excused'], 'weekend_days' => [5],
                'letter_scale' => [['min' => 90, 'max' => 100, 'letter' => 'A'], ['min' => 80, 'max' => 90, 'letter' => 'B'], ['min' => 70, 'max' => 80, 'letter' => 'C'], ['min' => 55, 'max' => 70, 'letter' => 'D'], ['min' => 0, 'max' => 55, 'letter' => 'F']],
            ]);
            if (User::where('role', Role::Admin)->exists()) return;
            $admin = config('lms.initial_admin');
            $admin['email'] = mb_strtolower(trim(Digits::normalize((string) $admin['email'])));
            Validator::make($admin, ['name' => ['required', 'string', 'between:2,100'], 'email' => ['required', 'email', 'max:254', 'unique:users,email'], 'password' => ['required', 'string', 'max:128', Password::min(12)->mixedCase()->numbers()->symbols()]])->validate();
            User::create(['name' => $admin['name'], 'email' => $admin['email'], 'password' => Hash::make($admin['password']), 'role' => Role::Admin, 'status' => 'active', 'locale' => 'fa', 'must_change_password' => true, 'institutional_id' => app(AccountService::class)->nextId(Role::Admin)]);
        });
    }
}
