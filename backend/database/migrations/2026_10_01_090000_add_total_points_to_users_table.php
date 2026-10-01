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
            $table->unsignedInteger('total_points')->default(0);
        });

        DB::table('users')->select(['id', 'progress'])->orderBy('id')->chunkById(100, function ($users): void {
            foreach ($users as $user) {
                $progress = is_string($user->progress)
                    ? json_decode($user->progress, true)
                    : [];
                $points = is_array($progress) ? max(0, (int) ($progress['totalPoints'] ?? 0)) : 0;
                DB::table('users')->where('id', $user->id)->update(['total_points' => $points]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('total_points');
        });
    }
};
