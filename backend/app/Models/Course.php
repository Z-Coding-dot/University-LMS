<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = ['department_id', 'code', 'name_fa', 'name_en', 'credits'];
    protected function casts(): array { return ['credits' => 'integer']; }
    public function department() { return $this->belongsTo(Department::class); }
    public function offerings() { return $this->hasMany(CourseOffering::class); }
}
