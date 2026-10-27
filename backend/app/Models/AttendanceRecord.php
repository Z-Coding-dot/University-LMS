<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $fillable = ['session_id', 'student_id', 'status'];
    protected function casts(): array { return ['status' => \App\Enums\AttendanceStatus::class]; }
    public function session() { return $this->belongsTo(AttendanceSession::class, 'session_id'); }
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
}
