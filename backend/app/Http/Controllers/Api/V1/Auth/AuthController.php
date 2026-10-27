<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\{LoginRequest, LogoutRequest};
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $input = $request->validated();
        return DB::transaction(function () use ($request, $input) {
            $user = User::where('email', $input['identifier'])->lockForUpdate()->first();
            // A real bcrypt check for unknown accounts avoids an email timing shortcut.
            $hash = $user?->password ?? '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
            if (!Hash::check($input['password'], $hash)) throw ValidationException::withMessages(['identifier' => __('messages.invalid_credentials')]);
            if (!$user) throw ValidationException::withMessages(['identifier' => __('messages.invalid_credentials')]);
            abort_if($user->status !== UserStatus::Active, 403, __('messages.inactive'));
            $data = ['user' => new UserResource($user)];
            if (config('lms.auth_mode') === 'token') {
                $data['token'] = $user->createToken('lms', ['*'], now()->addMinutes(config('session.lifetime', 120)))->plainTextToken;
            } else {
                abort_unless($request->hasSession(), 419, __('messages.csrf'));
                Auth::guard('web')->login($user);
                $request->session()->regenerate();
                // Persist immediately: a password reset racing this session write
                // must invalidate it even before the first authenticated API read.
                $request->session()->put('password_hash_web', Auth::guard('web')->hashPasswordForCookie($user->password));
            }
            return ApiResponse::data($data);
        });
    }

    public function me(Request $request) { return ApiResponse::data(new UserResource($request->user())); }

    public function logout(LogoutRequest $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) $token->delete();
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
        return response()->noContent();
    }
}
