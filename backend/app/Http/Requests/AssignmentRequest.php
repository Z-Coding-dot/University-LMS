<?php
namespace App\Http\Requests;
use App\Enums\{Role, Permission};
use App\Models\Assignment;
use App\Services\Academic\OfferingAccess;
class AssignmentRequest extends StrictFormRequest
{
    public function authorize(): bool { if (!$this->user()->hasPermission(Permission::ManageAssignments)) return false; if ($this->route('id')) app(OfferingAccess::class)->find($this->user(), Assignment::findOrFail($this->route('id'))->offering_id, Permission::ManageAssignments); return true; }
    public function rules(): array { return ['offering_id' => ['required', 'integer', 'min:1'], 'week_number' => ['required', 'integer', 'between:1,16'], 'submission_enabled' => ['required', 'boolean'], 'title' => ['required', 'string', 'max:200'], 'description' => ['present', 'nullable', 'string', 'max:10000'], 'due_date' => ['required', 'date_format:Y-m-d'], 'attachment_ids' => ['present', 'array', 'max:5'], 'attachment_ids.*' => ['required', 'integer', 'min:1', 'distinct']]; }
}
