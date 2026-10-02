<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $schoolName = env('SCHOOL_NAME', 'SD Negeri Nusantara');
        $school = School::firstOrNew(['name' => $schoolName]);
        if (! preg_match('/^[A-Z0-9]{8}$/', mb_strtoupper((string) $school->code))) {
            $configuredCode = mb_strtoupper(trim((string) env('SCHOOL_CODE')));
            $school->code = preg_match('/^[A-Z0-9]{8}$/', $configuredCode)
                ? $configuredCode
                : Str::upper(Str::random(8));
        }
        $school->is_active = true;
        $school->save();

        $platformUsername = env('PLATFORM_ADMIN_USERNAME');
        $platformPassword = env('PLATFORM_ADMIN_PASSWORD');
        if ($platformUsername && $platformPassword) {
            User::updateOrCreate(
                ['username' => mb_strtolower($platformUsername)],
                [
                    'name' => env('PLATFORM_ADMIN_NAME', 'Admin Platform Lentera'),
                    'email' => null,
                    'password' => Hash::make($platformPassword),
                    'role' => 'platform_admin',
                    'school_id' => null,
                ],
            );
        }

        $username = env('ADMIN_USERNAME');
        $password = env('ADMIN_PASSWORD');
        if (! $username || ! $password) {
            return;
        }

        User::updateOrCreate(
            ['username' => mb_strtolower($username)],
            [
                'name' => env('ADMIN_NAME', 'Guru Lentera'),
                'email' => null,
                'password' => Hash::make($password),
                'role' => 'teacher',
                'school_id' => $school->id,
            ],
        );
    }
}
