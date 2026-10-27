<?php
namespace App\Http\Requests;
class AcademicSettingsRequest extends StrictFormRequest
{
    public function rules(): array { return ['pass_mark' => ['required', 'numeric', 'between:0,100'], 'attendance_warning_threshold' => ['required', 'numeric', 'between:0,100'], 'letter_scale' => ['required', 'array', 'between:1,20'], 'letter_scale.*' => ['required', 'array:min,max,letter'], 'letter_scale.*.min' => ['required', 'numeric', 'between:0,100'], 'letter_scale.*.max' => ['required', 'numeric', 'between:0,100'], 'letter_scale.*.letter' => ['required', 'string', 'max:10'], 'attendance_counted_statuses' => ['required', 'array', 'min:1'], 'attendance_counted_statuses.*' => ['required', 'distinct', 'in:present,absent,late,excused'], 'weekend_days' => ['present', 'array', 'max:7'], 'weekend_days.*' => ['required', 'integer', 'between:1,7', 'distinct']]; }
}
