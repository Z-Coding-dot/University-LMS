<?php
namespace App\Http\Requests;
use App\Enums\Permission;
class AttendanceRequest extends OfferingMutationRequest
{
    protected function permission(): Permission { return Permission::TakeAttendance; }
    public function rules(): array { return ['date' => ['required', 'date_format:Y-m-d'], 'records' => ['required', 'array', 'min:1'], 'records.*' => ['required', 'array:student_id,status'], 'records.*.student_id' => ['required', 'integer', 'distinct'], 'records.*.status' => ['required', 'in:present,absent,late,excused']]; }
}
