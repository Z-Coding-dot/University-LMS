<?php
namespace App\Http\Requests;
use App\Enums\Permission;
class GradeBatchRequest extends OfferingMutationRequest
{
    protected function permission(): Permission { return Permission::EnterGrades; }
    public function rules(): array { return ['entries' => ['required', 'array', 'min:1'], 'entries.*' => ['required', 'array:student_id,component_id,score,feedback'], 'entries.*.student_id' => ['required', 'integer'], 'entries.*.component_id' => ['required', 'integer'], 'entries.*.score' => ['required', 'numeric', 'min:0'], 'entries.*.feedback' => ['sometimes', 'nullable', 'string', 'max:2000']]; }
}
