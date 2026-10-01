<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ContentController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\StudentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::get('/content/{type}', [ContentController::class, 'index'])
        ->whereIn('type', ['passages', 'questions']);
    Route::get('/settings', [SettingController::class, 'show']);
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/me/progress', [StudentController::class, 'showOwnProgress']);
        Route::put('/me/progress', [StudentController::class, 'saveOwnProgress']);

        Route::middleware('teacher')->group(function (): void {
            Route::post('/content/{type}', [ContentController::class, 'store'])
                ->whereIn('type', ['passages', 'questions']);
            Route::put('/content/{type}/{id}', [ContentController::class, 'update'])
                ->whereIn('type', ['passages', 'questions']);
            Route::delete('/content/{type}/{id}', [ContentController::class, 'destroy'])
                ->whereIn('type', ['passages', 'questions']);
            Route::get('/admin/students', [StudentController::class, 'index']);
            Route::post('/admin/students', [StudentController::class, 'store']);
            Route::put('/admin/students/{user}', [StudentController::class, 'update']);
            Route::delete('/admin/students/{user}', [StudentController::class, 'destroy']);
            Route::put('/settings', [SettingController::class, 'update']);
        });
    });
});
