<?php
namespace App\Http\Requests;
use App\Enums\Permission;
class ComponentsRequest extends OfferingMutationRequest
{
    protected function permission(): Permission { return Permission::EnterGrades; }
    public function rules(): array { return ['components' => ['required', 'array', 'min:1'], 'components.*' => ['required', 'array:id,name,max_score,weight'], 'components.*.id' => ['sometimes', 'integer', 'min:1', 'distinct'], 'components.*.name' => ['required', 'array:fa,en'], 'components.*.name.fa' => ['required', 'string', 'max:150'], 'components.*.name.en' => ['required', 'string', 'max:150'], 'components.*.max_score' => ['required', 'numeric', 'gt:0'], 'components.*.weight' => ['required', 'numeric', 'between:0,100']]; }
}
