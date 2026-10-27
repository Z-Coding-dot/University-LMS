<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;
    use \App\Models\Concerns\LocalizesSeedText;

    protected $fillable = ['assignment_id', 'student_id', 'submitted_at', 'score', 'feedback', 'translations'];
    protected function casts(): array { return ['submitted_at' => 'immutable_datetime', 'score' => 'float', 'translations' => 'array']; }
    public function assignment() { return $this->belongsTo(Assignment::class); }
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function files() { return $this->belongsToMany(Upload::class, 'submission_upload'); }
}
