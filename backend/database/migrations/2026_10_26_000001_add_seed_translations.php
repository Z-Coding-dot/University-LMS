<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        foreach (['lectures', 'assignments', 'announcements', 'submissions'] as $table) Schema::table($table, fn (Blueprint $t) => $t->json('translations')->nullable());
        Schema::table('grade_components', fn (Blueprint $t) => $t->index('weight'));
    }
    public function down(): void {
        Schema::table('grade_components', fn (Blueprint $t) => $t->dropIndex(['weight']));
        foreach (['lectures', 'assignments', 'announcements', 'submissions'] as $table) Schema::table($table, fn (Blueprint $t) => $t->dropColumn('translations'));
    }
};
