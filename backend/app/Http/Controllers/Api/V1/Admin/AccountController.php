<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\{CreateAccountRequest, UpdateAccountRequest, ResetAccountPasswordRequest, AccountStatusRequest};
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Accounts\AccountService;
use App\Support\{ApiResponse, ListQuery};
use Illuminate\Http\Request;

abstract class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', $request->route('managed_role'))->with('permissions');
        $page = (new ListQuery($request))->paginate($query, ['id' => 'id', 'name' => 'name', 'email' => 'email', 'institutional_id' => 'institutional_id', 'status' => 'status'], 'name');
        return ApiResponse::page($page, fn ($user) => new UserResource($user));
    }
    public function store(CreateAccountRequest $request, AccountService $accounts)
    {
        return $this->credentials($accounts->create(Role::from($request->route('managed_role')), $request->validated()), 201);
    }
    public function update(UpdateAccountRequest $request)
    {
        $request->target()->update($request->validated());
        return ApiResponse::data(new UserResource($request->target()));
    }
    public function resetPassword(ResetAccountPasswordRequest $request, AccountService $accounts)
    {
        return $this->credentials($accounts->resetPassword($request->target()));
    }
    public function status(AccountStatusRequest $request, AccountService $accounts)
    {
        return ApiResponse::data(new UserResource($accounts->status($request->target(), $request->validated('status'))));
    }
    private function credentials(array $issued, int $status = 200)
    {
        return ApiResponse::data(['user' => new UserResource($issued['user']), 'initial_password' => $issued['initial_password']], $status);
    }
}
