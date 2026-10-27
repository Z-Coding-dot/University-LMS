<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lecture extends Model
{
    use HasFactory;
    use \App\Models\Concerns\LocalizesSeedText;

    protected $fillable = ['offering_id', 'week_number', 'title', 'description', 'translations'];
    protected function casts(): array { return ['week_number' => 'integer', 'translations' => 'array']; }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
    public function attachments() { return $this->belongsToMany(Upload::class, 'lecture_upload'); }
}
