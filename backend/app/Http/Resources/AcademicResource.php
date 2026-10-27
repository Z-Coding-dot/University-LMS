<?php
namespace App\Http\Resources;
use App\Models\{GradeComponent, GradeEntry, AttendanceSession, AttendanceRecord, Upload, Lecture, Assignment, Submission, Announcement};
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class AcademicResource extends JsonResource
{
    public function toArray(Request $r): array
    {
        $m = $this->resource; $a = ['id' => $m->id];
        $fields = match (true) {
            $m instanceof GradeComponent => ['offering_id', 'max_score', 'weight'],
            $m instanceof GradeEntry => ['student_id', 'component_id', 'score', 'feedback'],
            $m instanceof AttendanceSession => ['offering_id'],
            $m instanceof AttendanceRecord => ['session_id', 'student_id'],
            $m instanceof Upload => ['size', 'mime_type'],
            $m instanceof Lecture => ['offering_id', 'week_number', 'title', 'description'],
            $m instanceof Assignment => ['offering_id', 'week_number', 'submission_enabled', 'title', 'description'],
            $m instanceof Submission => ['assignment_id', 'student_id', 'score', 'feedback'],
            $m instanceof Announcement => ['title', 'body', 'offering_id', 'week_number', 'author_id'],
            default => throw new \LogicException('Unsupported academic resource'),
        };
        foreach ($fields as $f) $a[$f] = $m->$f;
        if ($m instanceof GradeComponent) $a['name'] = ['fa' => $m->name_fa, 'en' => $m->name_en];
        if ($m instanceof GradeEntry) { $a['status'] = $m->component->offering->grade_status->value; $a['updated_at'] = $m->updated_at->toIso8601String(); }
        if ($m instanceof AttendanceSession) $a['date'] = $m->date->toDateString();
        if ($m instanceof AttendanceRecord) $a['status'] = $m->status->value;
        if ($m instanceof Upload) { $a['name'] = $m->original_name; $a['url'] = url('/api/v1/files/'.$m->id); $a['created_at'] = $m->created_at->toIso8601String(); }
        if ($m instanceof Lecture || $m instanceof Assignment) $a['attachments'] = self::collection($m->attachments);
        if ($m instanceof Lecture) $a['updated_at'] = $m->updated_at->toIso8601String();
        if ($m instanceof Assignment) $a['due_at'] = $m->due_at->toIso8601String();
        if ($m instanceof Submission) { $a['files'] = self::collection($m->files); $a['submitted_at'] = $m->submitted_at->toIso8601String(); }
        if ($m instanceof Announcement) { $a['audience'] = $m->audience->value; $a['role'] = $m->role?->value; $a['created_at'] = $m->created_at->toIso8601String(); }
        return $a;
    }
}
