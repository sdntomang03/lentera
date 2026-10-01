<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = AppSetting::find('portal')?->value ?? [];

        return response()->json([
            'data' => [
                'schoolName' => $settings['schoolName'] ?? 'SD Negeri Nusantara',
                'teacherName' => $settings['teacherName'] ?? 'Guru Penggerak',
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'schoolName' => ['required', 'string', 'max:160'],
            'teacherName' => ['required', 'string', 'max:120'],
        ]);
        AppSetting::updateOrCreate(['key' => 'portal'], ['value' => $data]);

        return response()->json(['data' => $data]);
    }
}
