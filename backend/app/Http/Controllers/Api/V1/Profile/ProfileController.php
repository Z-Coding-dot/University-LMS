<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\{ProfileRequest, PasswordRequest};
use App\Http\Resources\{UserResource, StructureResource};
use App\Services\Accounts\AccountService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(ProfileRequest $request)
    {
        $request->user()->update($request->validated());
        return ApiResponse::data(new UserResource($request->user()));
    }
    public function password(PasswordRequest $request, AccountService $accounts)
    {
        return ApiResponse::data(new UserResource($accounts->changeOwnPassword($request, $request->validated())));
    }
    public function context(Request $request)
    {
        $user = $request->user()->load(['department', 'currentSemester']);
        return ApiResponse::data(['department' => $user->department ? new StructureResource($user->department) : null, 'semester' => $user->currentSemester ? new StructureResource($user->currentSemester) : null]);
    }
}
