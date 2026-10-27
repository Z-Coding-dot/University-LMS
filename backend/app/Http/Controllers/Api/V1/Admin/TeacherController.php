<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\TeacherPermissionsRequest;
use App\Http\Resources\UserResource;
use App\Services\Accounts\AccountService;
use App\Support\ApiResponse;

class TeacherController extends AccountController
{
    public function permissions(TeacherPermissionsRequest $request, AccountService $accounts)
    {
        return ApiResponse::data(new UserResource($accounts->replacePermissions($request->target(), $request->validated('permissions'))));
    }
}
