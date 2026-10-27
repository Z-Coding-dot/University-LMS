<?php
namespace App\Http\Requests;
use Illuminate\Validation\Rule;
class OfferingRequest extends StrictFormRequest
{
    public function rules(): array { return ['course_id' => ['required', 'integer', 'exists:courses,id'], 'semester_id' => ['required', 'integer', 'exists:semesters,id'], 'teacher_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'teacher')->where('status', 'active')], 'capacity' => ['required', 'integer', 'between:1,1000']]; }
}
