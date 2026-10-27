<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use Illuminate\Validation\Rule;
use App\Support\StrictPayload;
use Illuminate\Validation\Validator;

class TeacherPermissionsRequest extends AccountMutationRequest
{
    public function rules(): array
    {
        return ['permissions' => ['present', 'array', 'max:7'], 'permissions.*' => ['string', 'distinct:strict', Rule::in(Permission::teacherGrants())]];
    }
    public function withValidator(Validator $validator): void
    {
        $validator->after(fn ($v) => StrictPayload::check($v, $this->all(), ['permissions']));
    }
}
