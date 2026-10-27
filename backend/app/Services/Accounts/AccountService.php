<?php

namespace App\Services\Accounts;

use App\Enums\{Role, UserStatus};
use App\Models\{User, InstitutionalSequence};
use Illuminate\Support\Facades\{DB, Hash};
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AccountService
{
    public function create(Role $role, #[\SensitiveParameter] array $input): array
    {
        return DB::transaction(function () use ($role, $input) {
            $password = $this->newPassword();
            $user = User::create([...$input, 'password' => Hash::make($password), 'role' => $role,
                'status' => UserStatus::Active, 'must_change_password' => false, 'institutional_id' => $this->nextId($role)]);
            return ['user' => $user, 'initial_password' => $password];
        });
    }

    public function nextId(Role $role): string
    {
        // Caller holds a transaction; the seeded sequence row serializes allocations.
        $prefix = match ($role) { Role::Admin => 'AD', Role::Teacher => 'TC', Role::Student => 'ST' };
        $sequence = InstitutionalSequence::whereKey($prefix)->lockForUpdate()->firstOrFail();
        do {
            $sequence->number++;
            $id = $prefix.'-'.str_pad((string) $sequence->number, 3, '0', STR_PAD_LEFT);
        } while (User::where('institutional_id', $id)->exists());
        $sequence->save();
        return $id;
    }

    public function newPassword(): string
    {
        do {
            $password = 'U9!a'.bin2hex(random_bytes(16));
            // Keyed fingerprints enforce uniqueness without retaining plaintext or
            // logging issued passwords. The ledger is never an API resource.
            $fingerprint = hash_hmac('sha256', $password, (string) config('app.key'));
        } while (!DB::table('issued_password_fingerprints')->insertOrIgnore(['fingerprint' => $fingerprint]));
        return $password;
    }

    public function resetPassword(User $user): array
    {
        return DB::transaction(function () use ($user) {
            $target = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $password = $this->newPassword();
            $target->update(['password' => Hash::make($password), 'must_change_password' => false, 'remember_token' => null]);
            $this->invalidate($target);
            return ['user' => $target, 'initial_password' => $password];
        });
    }

    public function status(User $user, string $status): User
    {
        return DB::transaction(function () use ($user, $status) {
            $target = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $target->update(['status' => $status]);
            if ($status === UserStatus::Inactive->value) $this->invalidate($target);
            return $target;
        });
    }

    public function invalidate(User $user, ?string $sessionId = null, ?int $tokenId = null): void
    {
        $sessions = DB::table('sessions')->where('user_id', $user->id);
        if ($sessionId !== null) $sessions->where('id', '<>', $sessionId);
        $sessions->delete();
        $tokens = $user->tokens();
        if ($tokenId !== null) $tokens->where('id', '<>', $tokenId);
        $tokens->delete();
    }

    public function changeOwnPassword(Request $request, #[\SensitiveParameter] array $input): User
    {
        return DB::transaction(function () use ($request, $input) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if (!Hash::check($input['current_password'], $user->password)) {
                throw ValidationException::withMessages(['current_password' => __('messages.current_password_invalid')]);
            }
            $user->update(['password' => Hash::make($input['password']), 'must_change_password' => false, 'remember_token' => null]);
            $token = $request->user()->currentAccessToken();
            $tokenId = $token instanceof \Laravel\Sanctum\PersonalAccessToken ? $token->id : null;
            $sessionId = $request->hasSession() ? $request->session()->getId() : null;
            $this->invalidate($user, $sessionId, $tokenId);
            if ($request->hasSession()) $request->session()->put('password_hash_web', $user->password);
            // Sanctum's AuthenticateSession must observe the updated object on return.
            $request->user()->setRawAttributes($user->getAttributes());
            return $user;
        });
    }

    public function replacePermissions(User $teacher, array $permissions): User
    {
        return DB::transaction(function () use ($teacher, $permissions) {
            $target = User::whereKey($teacher->id)->lockForUpdate()->firstOrFail();
            $target->permissions()->delete();
            $target->permissions()->createMany(array_map(fn ($permission) => ['permission' => $permission], $permissions));
            return $target->load('permissions');
        });
    }
}
