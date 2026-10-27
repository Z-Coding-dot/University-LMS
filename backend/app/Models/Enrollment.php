<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = ['student_id', 'offering_id'];
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
}
