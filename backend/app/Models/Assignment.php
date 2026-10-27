<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;
    use \App\Models\Concerns\LocalizesSeedText;

    protected $fillable = ['offering_id', 'week_number', 'submission_enabled', 'title', 'description', 'due_at', 'translations'];
    protected function casts(): array { return ['week_number' => 'integer', 'submission_enabled' => 'boolean', 'due_at' => 'immutable_datetime', 'translations' => 'array']; }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
    public function submissions() { return $this->hasMany(Submission::class); }
    public function attachments() { return $this->belongsToMany(Upload::class, 'assignment_upload'); }
}
