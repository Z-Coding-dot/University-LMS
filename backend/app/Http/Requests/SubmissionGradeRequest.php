<?php
namespace App\Http\Requests;
use App\Enums\Permission;
use App\Models\Submission;
use App\Services\Academic\OfferingAccess;
class SubmissionGradeRequest extends StrictFormRequest
{
    public function authorize(): bool { if (!$this->user()->hasPermission(Permission::ManageAssignments)) return false; app(OfferingAccess::class)->find($this->user(), Submission::findOrFail($this->route('id'))->assignment->offering_id, Permission::ManageAssignments); return true; }
    public function rules(): array { return ['score' => ['required', 'numeric', 'between:0,100'], 'feedback' => ['present', 'nullable', 'string', 'max:2000']]; }
}
