<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Upload extends Model
{
    use HasFactory;

    protected $fillable = ['uploader_id', 'offering_id', 'purpose', 'original_name', 'path', 'size', 'mime_type'];
    protected $hidden = ['path'];
    protected function casts(): array { return ['purpose' => \App\Enums\UploadPurpose::class, 'size' => 'integer']; }
    public function uploader() { return $this->belongsTo(User::class, 'uploader_id'); }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
    public function lectures() { return $this->belongsToMany(Lecture::class, 'lecture_upload'); }
    public function assignments() { return $this->belongsToMany(Assignment::class, 'assignment_upload'); }
    public function submissions() { return $this->belongsToMany(Submission::class, 'submission_upload'); }
}
