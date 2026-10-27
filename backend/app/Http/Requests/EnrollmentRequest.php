<?php
namespace App\Http\Requests;
use Illuminate\Validation\Rule;
class EnrollmentRequest extends StrictFormRequest
{
    public function rules(): array { return ['student_ids' => ['required', 'array', 'min:1', 'max:100'], 'student_ids.*' => ['required', 'integer', 'distinct', Rule::exists('users', 'id')->where('role', 'student')->where('status', 'active')], 'make_current' => ['required', 'boolean']]; }
}
