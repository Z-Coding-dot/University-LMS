<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'course_id' => $this->course_id, 'semester_id' => $this->semester_id, 'teacher_id' => $this->teacher_id,
            'capacity' => $this->capacity, 'schedule' => $this->schedule->map(fn ($s) => ['id' => $s->id, 'offering_id' => $s->offering_id, 'weekday' => $s->weekday, 'start' => substr($s->start, 0, 5), 'end' => substr($s->end, 0, 5), 'room' => $s->room]),
            'course' => new StructureResource($this->course), 'semester' => new StructureResource($this->semester), 'teacher' => ['id' => $this->teacher_id, 'name' => $this->teacher->name],
            'student_count' => $this->enrollments_count ?? $this->enrollments()->count(), 'grade_status' => $this->grade_status->value];
    }
}
