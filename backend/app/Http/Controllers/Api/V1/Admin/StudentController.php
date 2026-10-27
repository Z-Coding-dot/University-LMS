<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\AcademicProfileRequest;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;

class StudentController extends AccountController
{
    public function academicProfile(AcademicProfileRequest $request)
    {
        $request->target()->update($request->validated());
        return ApiResponse::data(new UserResource($request->target()));
    }
}
