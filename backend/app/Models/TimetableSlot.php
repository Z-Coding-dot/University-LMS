<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimetableSlot extends Model
{
    use HasFactory;

    protected $fillable = ['offering_id', 'weekday', 'start', 'end', 'room'];
    protected function casts(): array { return ['weekday' => 'integer']; }
    public function offering() { return $this->belongsTo(CourseOffering::class, 'offering_id'); }
}
