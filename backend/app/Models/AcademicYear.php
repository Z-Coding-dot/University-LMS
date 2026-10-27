<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'starts_at', 'ends_at'];
    protected function casts(): array { return ['starts_at' => 'date:Y-m-d', 'ends_at' => 'date:Y-m-d']; }
    public function semesters() { return $this->hasMany(Semester::class); }
}
