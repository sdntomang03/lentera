<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FcmDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FcmDeviceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'deviceId' => ['required', 'uuid'],
            'token' => ['required', 'string', 'max:4096'],
            'platform' => ['required', 'in:android,ios'],
        ]);

        FcmDevice::updateOrCreate(
            ['device_id' => $data['deviceId']],
            [
                'token' => $data['token'],
                'platform' => $data['platform'],
            ],
        );

        return response()->json([
            'message' => 'Perangkat berhasil didaftarkan untuk notifikasi.',
            'deviceId' => $data['deviceId'],
        ], 200);
    }
}
