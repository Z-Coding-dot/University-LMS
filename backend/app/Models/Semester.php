<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    use HasFactory;

    protected $fillable = ['academic_year_id', 'name_fa', 'name_en', 'starts_at', 'ends_at'];
    protected function casts(): array { return ['starts_at' => 'date:Y-m-d', 'ends_at' => 'date:Y-m-d']; }
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
    public function offerings() { return $this->hasMany(CourseOffering::class); }
}
