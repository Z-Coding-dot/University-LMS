<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseOffering extends Model
{
    use HasFactory;

    protected $fillable = ['course_id', 'semester_id', 'teacher_id', 'capacity', 'grade_status'];
    protected function casts(): array { return ['capacity' => 'integer', 'grade_status' => \App\Enums\GradeStatus::class]; }
    public function course() { return $this->belongsTo(Course::class); }
    public function semester() { return $this->belongsTo(Semester::class); }
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
    public function enrollments() { return $this->hasMany(Enrollment::class, 'offering_id'); }
    public function schedule() { return $this->hasMany(TimetableSlot::class, 'offering_id'); }
    public function components() { return $this->hasMany(GradeComponent::class, 'offering_id'); }
    public function attendanceSessions() { return $this->hasMany(AttendanceSession::class, 'offering_id'); }
    public function assignments() { return $this->hasMany(Assignment::class, 'offering_id'); }
    public function lectures() { return $this->hasMany(Lecture::class, 'offering_id'); }
    public function announcements() { return $this->hasMany(Announcement::class, 'offering_id'); }
}
