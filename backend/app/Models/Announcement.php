<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;
    use \App\Models\Concerns\LocalizesSeedText;

    protected $fillable = ['title', 'body', 'audience', 'role', 'offering_id', 'week_number', 'author_id', 'translations'];
    protected function casts(): array { return ['audience' => \App\Enums\Audience::class, 'role' => \App\Enums\Role::class, 'week_number' => 'integer', 'translations' => 'array']; }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
    public function author() { return $this->belongsTo(User::class, 'author_id'); }
}
