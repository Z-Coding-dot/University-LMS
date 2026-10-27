<?php

namespace App\Models;

use App\Enums\{Role, UserStatus, Permission};
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = ['name', 'email', 'password', 'role', 'status', 'locale', 'must_change_password', 'institutional_id', 'department_id', 'current_semester_id', 'remember_token'];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array
    {
        return ['role' => Role::class, 'status' => UserStatus::class, 'must_change_password' => 'boolean', 'password' => 'hashed'];
    }
    public function permissions() { return $this->hasMany(UserPermission::class); }
    public function department() { return $this->belongsTo(Department::class); }
    public function currentSemester() { return $this->belongsTo(Semester::class, 'current_semester_id'); }
    public function enrollments() { return $this->hasMany(Enrollment::class, 'student_id'); }
    public function offerings() { return $this->hasMany(CourseOffering::class, 'teacher_id'); }
    public function permissionValues(): array
    {
        return $this->permissions->map(fn ($row) => $row->permission->value)->values()->all();
    }
    public function hasPermission(Permission $permission): bool
    {
        if ($this->role === Role::Admin) return $permission !== Permission::TakeAttendance;
        return $this->role === Role::Teacher && $permission !== Permission::UnlockGrades && in_array($permission->value, $this->permissionValues(), true);
    }
}
