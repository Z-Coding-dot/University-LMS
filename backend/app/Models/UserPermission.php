<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPermission extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'permission'];
    public $timestamps = false;
    protected function casts(): array { return ['permission' => \App\Enums\Permission::class]; }
    public function user() { return $this->belongsTo(User::class); }
}
