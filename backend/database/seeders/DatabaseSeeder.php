<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $username = env('ADMIN_USERNAME');
        $password = env('ADMIN_PASSWORD');
        if (! $username || ! $password) {
            return;
        }

        User::updateOrCreate(
            ['username' => $username],
            [
                'name' => env('ADMIN_NAME', 'Guru Lentera'),
                'email' => null,
                'password' => Hash::make($password),
                'role' => 'teacher',
                'school' => env('SCHOOL_NAME', 'SD Negeri Nusantara'),
            ],
        );
    }
}
