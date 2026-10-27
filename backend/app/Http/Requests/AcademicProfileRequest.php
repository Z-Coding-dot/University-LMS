<?php

namespace App\Http\Requests;

class AcademicProfileRequest extends AccountMutationRequest
{
    public function rules(): array
    {
        return ['department_id' => ['present', 'nullable', 'integer', 'exists:departments,id'], 'current_semester_id' => ['present', 'nullable', 'integer', 'exists:semesters,id']];
    }
}
