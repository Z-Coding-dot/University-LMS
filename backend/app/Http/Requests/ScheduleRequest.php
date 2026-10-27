<?php
namespace App\Http\Requests;
class ScheduleRequest extends StrictFormRequest
{
    public function rules(): array { return ['slots' => ['present', 'array', 'max:30'], 'slots.*' => ['required', 'array:weekday,start,end,room'], 'slots.*.weekday' => ['required', 'integer', 'between:1,7'], 'slots.*.start' => ['required', 'date_format:H:i'], 'slots.*.end' => ['required', 'date_format:H:i', 'after:slots.*.start'], 'slots.*.room' => ['required', 'string', 'max:100']]; }
}
