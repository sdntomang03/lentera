<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SettingController extends Controller
{
    public function updateOwnProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
        ]);
        $user = $request->user();
        $user->update(['name' => trim($data['name'])]);

        return response()->json(['data' => ['name' => $user->name]]);
    }

    public function show(Request $request): JsonResponse
    {
        $school = $request->user()?->school;
        $settings = AppSetting::find('portal')?->value ?? [];

        return response()->json([
            'data' => [
                'schoolName' => $school?->name ?? $settings['schoolName'] ?? 'SD Negeri Nusantara',
                'teacherName' => $request->user()?->role === 'teacher'
                    ? $request->user()->name
                    : ($settings['teacherName'] ?? 'Guru Penggerak'),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $school = $user?->school;
        abort_unless($school, 403, 'Akun guru belum terhubung ke sekolah.');

        $data = $request->validate([
            'schoolName' => [
                'required',
                'string',
                'max:160',
                Rule::unique('schools', 'name')->ignore($school->id),
            ],
            'teacherName' => ['required', 'string', 'max:120'],
        ]);

        DB::transaction(function () use ($school, $user, $data): void {
            $school->update(['name' => $data['schoolName']]);
            $user->update(['name' => $data['teacherName']]);
        });

        return response()->json([
            'data' => [
                'schoolName' => $school->name,
                'teacherName' => $user->name,
            ],
        ]);
    }
}
