<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstitutionalSequence extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;
    protected $primaryKey = 'prefix';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['prefix', 'number'];
    protected function casts(): array { return ['number' => 'integer']; }
}
