<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fcm_devices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('device_id')->unique();
            $table->text('token');
            $table->string('platform', 16);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fcm_devices');
    }
};
