<?php

namespace App\Http\Requests;

use App\Support\AcademicValidation as V;
use Illuminate\Validation\Rule;

class StructureRequest extends StrictFormRequest
{
    public function rules(): array
    {
        $dates = ['starts_at' => ['required', 'date_format:Y-m-d'], 'ends_at' => ['required', 'date_format:Y-m-d', 'after_or_equal:starts_at']];
        return match ($this->route('resource')) {
            'faculties' => V::name(),
            'departments' => V::name() + ['faculty_id' => ['required', 'integer', 'exists:faculties,id']],
            'academic-years' => ['name' => ['required', 'string', 'max:150']] + $dates,
            'semesters' => V::name() + $dates + ['academic_year_id' => ['required', 'integer', 'exists:academic_years,id']],
            'courses' => V::name() + ['department_id' => ['required', 'integer', 'exists:departments,id'], 'code' => ['required', 'string', 'max:30', Rule::unique('courses')->ignore($this->route('id'))], 'credits' => ['required', 'integer', 'between:1,30']],
            default => abort(404),
        };
    }
}
