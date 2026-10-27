<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculties', function (Blueprint $t) {
            $t->id(); $t->string('name_fa', 150)->index(); $t->string('name_en', 150)->index(); $t->timestamps();
        });
        Schema::create('departments', function (Blueprint $t) {
            $t->id(); $t->foreignId('faculty_id')->index()->constrained()->restrictOnDelete();
            $t->string('name_fa', 150)->index(); $t->string('name_en', 150)->index(); $t->timestamps();
        });
        Schema::create('academic_years', function (Blueprint $t) {
            $t->id(); $t->string('name', 150)->index(); $t->date('starts_at')->index(); $t->date('ends_at')->index(); $t->timestamps();
        });
        Schema::create('semesters', function (Blueprint $t) {
            $t->id(); $t->foreignId('academic_year_id')->index()->constrained()->restrictOnDelete();
            $t->string('name_fa', 150)->index(); $t->string('name_en', 150)->index();
            $t->date('starts_at')->index(); $t->date('ends_at')->index(); $t->timestamps();
        });
        Schema::create('courses', function (Blueprint $t) {
            $t->id(); $t->foreignId('department_id')->index()->constrained()->restrictOnDelete();
            $t->string('code', 30)->unique(); $t->string('name_fa', 150)->index(); $t->string('name_en', 150)->index();
            $t->unsignedSmallInteger('credits')->index(); $t->timestamps();
        });
        Schema::create('institutional_sequences', function (Blueprint $t) {
            $t->string('prefix', 2)->primary(); $t->unsignedBigInteger('number')->default(0);
        });
        DB::table('institutional_sequences')->insert(array_map(fn ($prefix) => ['prefix' => $prefix, 'number' => 0], ['AD', 'ST', 'TC']));
        Schema::create('users', function (Blueprint $t) {
            $t->id(); $t->string('name', 100)->index(); $t->string('email', 254)->unique();
            $t->string('password'); $t->string('role', 16)->index(); $t->string('status', 16)->default('active')->index();
            $t->string('locale', 2)->default('fa'); $t->boolean('must_change_password')->default(false);
            $t->string('institutional_id', 32)->unique();
            $t->foreignId('department_id')->nullable()->index()->constrained()->restrictOnDelete();
            $t->foreignId('current_semester_id')->nullable()->index()->constrained('semesters')->restrictOnDelete();
            $t->rememberToken(); $t->timestamps();
        });
        Schema::create('user_permissions', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->index()->constrained()->cascadeOnDelete();
            $t->string('permission', 64)->index(); $t->unique(['user_id', 'permission']);
        });
        Schema::create('issued_password_fingerprints', function (Blueprint $t) {
            $t->char('fingerprint', 64)->primary();
        });
        Schema::create('sessions', function (Blueprint $t) {
            $t->string('id')->primary(); $t->foreignId('user_id')->nullable()->index()->constrained()->cascadeOnDelete();
            $t->string('ip_address', 45)->nullable(); $t->text('user_agent')->nullable();
            $t->longText('payload'); $t->integer('last_activity')->index();
        });
        Schema::create('personal_access_tokens', function (Blueprint $t) {
            $t->id();
            // Sanctum's morph is kept compatible, with a real FK to the only token owner.
            $t->string('tokenable_type'); $t->unsignedBigInteger('tokenable_id')->index();
            $t->index(['tokenable_type', 'tokenable_id']);
            $t->foreign('tokenable_id')->references('id')->on('users')->cascadeOnDelete();
            $t->text('name'); $t->string('token', 64)->unique(); $t->text('abilities')->nullable();
            $t->timestamp('last_used_at')->nullable(); $t->timestamp('expires_at')->nullable()->index(); $t->timestamps();
        });
        Schema::create('academic_settings', function (Blueprint $t) {
            // A fixed primary key of 1 is used by the service and seeder.
            $t->unsignedTinyInteger('id')->primary(); $t->double('pass_mark'); $t->json('letter_scale');
            $t->json('attendance_counted_statuses'); $t->double('attendance_warning_threshold'); $t->json('weekend_days'); $t->timestamps();
        });
        Schema::create('course_offerings', function (Blueprint $t) {
            $t->id(); $t->foreignId('course_id')->index()->constrained()->restrictOnDelete();
            $t->foreignId('semester_id')->index()->constrained()->restrictOnDelete();
            $t->foreignId('teacher_id')->index()->constrained('users')->restrictOnDelete();
            $t->unsignedSmallInteger('capacity')->index(); $t->string('grade_status', 16)->default('draft')->index(); $t->timestamps();
        });
        Schema::create('enrollments', function (Blueprint $t) {
            $t->id(); $t->foreignId('student_id')->index()->constrained('users')->restrictOnDelete();
            $t->foreignId('offering_id')->index()->constrained('course_offerings')->restrictOnDelete();
            $t->unique(['student_id', 'offering_id']); $t->timestamps();
        });
        Schema::create('timetable_slots', function (Blueprint $t) {
            $t->id(); $t->foreignId('offering_id')->index()->constrained('course_offerings')->cascadeOnDelete();
            $t->unsignedTinyInteger('weekday')->index(); $t->time('start')->index(); $t->time('end')->index(); $t->string('room', 100)->index(); $t->timestamps();
        });
        Schema::create('grade_components', function (Blueprint $t) {
            $t->id(); $t->foreignId('offering_id')->index()->constrained('course_offerings')->restrictOnDelete();
            $t->string('name_fa', 150)->index(); $t->string('name_en', 150)->index();
            $t->double('max_score'); $t->double('weight'); $t->timestamps();
        });
        Schema::create('grade_entries', function (Blueprint $t) {
            $t->id(); $t->foreignId('student_id')->index()->constrained('users')->restrictOnDelete();
            $t->foreignId('component_id')->index()->constrained('grade_components')->cascadeOnDelete();
            $t->double('score')->index(); $t->text('feedback')->nullable(); $t->timestamps(); $t->index('updated_at');
            $t->unique(['student_id', 'component_id']);
        });
        Schema::create('attendance_sessions', function (Blueprint $t) {
            $t->id(); $t->foreignId('offering_id')->index()->constrained('course_offerings')->restrictOnDelete();
            $t->date('date')->index(); $t->unique(['offering_id', 'date']); $t->timestamps();
        });
        Schema::create('attendance_records', function (Blueprint $t) {
            $t->id(); $t->foreignId('session_id')->index()->constrained('attendance_sessions')->cascadeOnDelete();
            $t->foreignId('student_id')->index()->constrained('users')->restrictOnDelete();
            $t->string('status', 16)->index(); $t->unique(['session_id', 'student_id']); $t->timestamps();
        });
        Schema::create('lectures', function (Blueprint $t) {
            $t->id(); $t->foreignId('offering_id')->index()->constrained('course_offerings')->restrictOnDelete();
            $t->unsignedTinyInteger('week_number')->index(); $t->string('title', 200)->index(); $t->text('description'); $t->timestamps(); $t->index('updated_at');
        });
        Schema::create('assignments', function (Blueprint $t) {
            $t->id(); $t->foreignId('offering_id')->index()->constrained('course_offerings')->restrictOnDelete();
            $t->unsignedTinyInteger('week_number')->index(); $t->boolean('submission_enabled')->default(true);
            $t->string('title', 200)->index(); $t->text('description'); $t->dateTime('due_at')->index(); $t->timestamps();
        });
        Schema::create('submissions', function (Blueprint $t) {
            $t->id(); $t->foreignId('assignment_id')->index()->constrained()->restrictOnDelete();
            $t->foreignId('student_id')->index()->constrained('users')->restrictOnDelete();
            $t->dateTime('submitted_at')->index(); $t->double('score')->nullable()->index(); $t->text('feedback')->nullable();
            $t->unique(['assignment_id', 'student_id']); $t->timestamps();
        });
        Schema::create('uploads', function (Blueprint $t) {
            $t->id(); $t->foreignId('uploader_id')->index()->constrained('users')->restrictOnDelete();
            $t->foreignId('offering_id')->index()->constrained('course_offerings')->restrictOnDelete();
            $t->string('purpose', 16)->index(); $t->string('original_name')->index(); $t->string('path')->unique();
            $t->unsignedBigInteger('size'); $t->string('mime_type', 150); $t->timestamps(); $t->index('created_at');
        });
        foreach (['lecture', 'assignment', 'submission'] as $parent) {
            Schema::create($parent.'_upload', function (Blueprint $t) use ($parent) {
                $t->foreignId($parent.'_id')->index()->constrained($parent.'s')->cascadeOnDelete();
                $t->foreignId('upload_id')->index()->constrained()->restrictOnDelete();
                $t->primary([$parent.'_id', 'upload_id']);
            });
        }
        Schema::create('announcements', function (Blueprint $t) {
            $t->id(); $t->string('title', 200)->index(); $t->text('body'); $t->string('audience', 16)->index();
            $t->string('role', 16)->nullable()->index();
            $t->foreignId('offering_id')->nullable()->index()->constrained('course_offerings')->restrictOnDelete();
            $t->unsignedTinyInteger('week_number')->nullable()->index();
            $t->foreignId('author_id')->index()->constrained('users')->restrictOnDelete(); $t->timestamps(); $t->index('created_at');
        });
        // Laravel's schema API supplies MySQL full-text indexes for TEXT fields.
        // SQLite tests omit these optional indexes; queries keep substring semantics.
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            foreach (['lectures' => 'description', 'assignments' => 'description', 'announcements' => 'body', 'grade_entries' => 'feedback', 'submissions' => 'feedback'] as $table => $column) {
                Schema::table($table, fn (Blueprint $t) => $t->fullText($column));
            }
        }
    }

    public function down(): void
    {
        foreach (['announcements', 'submission_upload', 'assignment_upload', 'lecture_upload', 'uploads', 'submissions', 'assignments', 'lectures', 'attendance_records', 'attendance_sessions', 'grade_entries', 'grade_components', 'timetable_slots', 'enrollments', 'course_offerings', 'academic_settings', 'personal_access_tokens', 'sessions', 'issued_password_fingerprints', 'user_permissions', 'users', 'institutional_sequences', 'courses', 'semesters', 'academic_years', 'departments', 'faculties'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
