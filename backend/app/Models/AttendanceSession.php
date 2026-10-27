<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceSession extends Model
{
    use HasFactory;

    protected $fillable = ['offering_id', 'date'];
    protected function casts(): array { return ['date' => 'date:Y-m-d']; }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
    public function records() { return $this->hasMany(AttendanceRecord::class, 'session_id'); }
}
