<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeComponent extends Model
{
    use HasFactory;

    protected $fillable = ['offering_id', 'name_fa', 'name_en', 'max_score', 'weight'];
    protected function casts(): array { return ['max_score' => 'float', 'weight' => 'float']; }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
    public function entries() { return $this->hasMany(GradeEntry::class, 'component_id'); }
}
