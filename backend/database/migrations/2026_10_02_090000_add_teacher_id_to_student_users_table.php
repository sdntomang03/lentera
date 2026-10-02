<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('teacher_id')->nullable()->after('school_id')->constrained('users')->nullOnDelete();
            $table->index(['teacher_id', 'role']);
        });

        foreach (DB::table('users')->where('role', 'teacher')->select('school_id')->distinct()->pluck('school_id') as $schoolId) {
            $teacherIds = DB::table('users')
                ->where('role', 'teacher')
                ->where('school_id', $schoolId)
                ->pluck('id');
            if ($teacherIds->count() === 1) {
                DB::table('users')
                    ->where('role', 'student')
                    ->where('school_id', $schoolId)
                    ->update(['teacher_id' => $teacherIds->first()]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['teacher_id', 'role']);
            $table->dropConstrainedForeignId('teacher_id');
        });
    }
};
