<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 160)->unique();
            $table->string('code', 12)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // The owner requested a clean start rather than carrying forward unscoped tenant data.
        DB::table('users')->delete();
        DB::table('content_items')->delete();
        DB::table('app_settings')->delete();

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('school');
            $table->foreignId('school_id')->nullable()->after('role')->constrained()->cascadeOnDelete();
            $table->index(['school_id', 'role']);
        });

        Schema::table('content_items', function (Blueprint $table): void {
            $table->foreignId('school_id')->nullable()->after('type')->constrained()->cascadeOnDelete();
            $table->index(['school_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('content_items', function (Blueprint $table): void {
            $table->dropIndex(['school_id', 'type']);
            $table->dropConstrainedForeignId('school_id');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['school_id', 'role']);
            $table->dropConstrainedForeignId('school_id');
            $table->string('school')->nullable();
        });

        Schema::dropIfExists('schools');
    }
};
