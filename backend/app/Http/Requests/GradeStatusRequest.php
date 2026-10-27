<?php
namespace App\Http\Requests;
use App\Enums\Permission;
class GradeStatusRequest extends OfferingMutationRequest
{
    protected function permission(): Permission { return Permission::PublishGrades; }
    public function rules(): array { return ['status' => ['required', 'in:draft,published,locked']]; }
}
