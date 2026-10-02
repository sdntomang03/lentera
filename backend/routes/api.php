<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ContentController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\SchoolController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\StudentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::get('/schools/lookup/{code}', [SchoolController::class, 'lookup'])->middleware('throttle:20,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::middleware('active-school')->group(function (): void {
            Route::get('/me/progress', [StudentController::class, 'showOwnProgress']);
            Route::put('/me/progress', [StudentController::class, 'saveOwnProgress']);
            Route::get('/settings', [SettingController::class, 'show']);
            Route::get('/leaderboard', [LeaderboardController::class, 'index']);
            Route::get('/content/{type}', [ContentController::class, 'index'])
                ->whereIn('type', ['passages', 'questions', 'reading-practice']);

            Route::middleware('teacher')->group(function (): void {
                Route::post('/content/{type}', [ContentController::class, 'store'])
                    ->whereIn('type', ['passages', 'questions', 'reading-practice']);
                Route::put('/content/{type}/{id}', [ContentController::class, 'update'])
                    ->whereIn('type', ['passages', 'questions', 'reading-practice']);
                Route::delete('/content/{type}/{id}', [ContentController::class, 'destroy'])
                    ->whereIn('type', ['passages', 'questions', 'reading-practice']);
                Route::get('/admin/students', [StudentController::class, 'index']);
                Route::post('/admin/students', [StudentController::class, 'store']);
                Route::get('/admin/teachers', [StudentController::class, 'indexTeachers']);
                Route::post('/admin/teachers', [StudentController::class, 'storeTeacher']);
                Route::put('/admin/students/{user}', [StudentController::class, 'update']);
                Route::delete('/admin/students/{user}', [StudentController::class, 'destroy']);
                Route::put('/settings', [SettingController::class, 'update']);
            });
        });

        Route::middleware('platform-admin')->group(function (): void {
            Route::get('/platform/schools', [SchoolController::class, 'index']);
            Route::post('/platform/schools', [SchoolController::class, 'store']);
            Route::put('/platform/schools/{school}', [SchoolController::class, 'update']);
        });
    });

});
