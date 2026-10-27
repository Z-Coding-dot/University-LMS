<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeEntry extends Model
{
    use HasFactory;

    protected $fillable = ['student_id', 'component_id', 'score', 'feedback'];
    protected function casts(): array { return ['score' => 'float']; }
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function component() { return $this->belongsTo(GradeComponent::class, 'component_id'); }
}
