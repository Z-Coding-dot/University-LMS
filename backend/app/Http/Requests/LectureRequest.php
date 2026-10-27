<?php
namespace App\Http\Requests;
use App\Enums\Permission;
class LectureRequest extends OfferingMutationRequest
{
    protected function permission(): Permission { return Permission::ManageMaterials; }
    public function rules(): array { return ['offering_id' => ['required', 'integer', 'min:1'], 'week_number' => ['required', 'integer', 'between:1,16'], 'title' => ['required', 'string', 'max:200'], 'description' => ['present', 'nullable', 'string', 'max:10000'], 'attachment_ids' => ['present', 'array', 'max:5'], 'attachment_ids.*' => ['required', 'integer', 'min:1', 'distinct']]; }
}
