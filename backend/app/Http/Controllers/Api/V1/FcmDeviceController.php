<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FcmDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FcmDeviceController extends Controller
{
    public function index(): JsonResponse
    {
        $devices = FcmDevice::query()
            ->leftJoin('users', 'users.id', '=', 'fcm_devices.user_id')
            ->select([
                'fcm_devices.id',
                'fcm_devices.device_id',
                'fcm_devices.username',
                'fcm_devices.token',
                'fcm_devices.platform',
                'fcm_devices.updated_at',
                DB::raw('users.username as account_username'),
            ])
            ->orderByDesc('fcm_devices.updated_at')
            ->paginate(25);

        return response()->json([
            'data' => collect($devices->items())->map(fn (FcmDevice $device): array => [
                'id' => $device->id,
                'deviceId' => $device->device_id,
                'username' => $device->username ?: $device->account_username,
                'token' => $device->token,
                'platform' => $device->platform,
                'updatedAt' => $device->updated_at,
            ]),
            'current_page' => $devices->currentPage(),
            'last_page' => $devices->lastPage(),
            'total' => $devices->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'deviceId' => ['required', 'uuid'],
            'token' => ['required', 'string', 'max:4096'],
            'platform' => ['required', 'in:android,ios'],
            'username' => ['sometimes', 'string', 'max:255', Rule::in([$request->user()->username])],
        ]);

        FcmDevice::updateOrCreate(
            ['device_id' => $data['deviceId']],
            [
                'user_id' => $request->user()->id,
                'username' => $request->user()->username,
                'token' => $data['token'],
                'platform' => $data['platform'],
            ],
        );

        return response()->json([
            'message' => 'Perangkat berhasil didaftarkan untuk notifikasi.',
            'deviceId' => $data['deviceId'],
            'username' => $request->user()->username,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'deviceId' => ['required', 'uuid'],
        ]);

        FcmDevice::query()
            ->where('user_id', $request->user()->id)
            ->where('device_id', $data['deviceId'])
            ->delete();

        return response()->json([
            'message' => 'Perangkat berhasil dilepas dari notifikasi.',
        ]);
    }

    public function destroyDevice(FcmDevice $device): JsonResponse
    {
        $device->delete();

        return response()->json([
            'message' => 'Pendaftaran perangkat FCM berhasil dihapus.',
        ]);
    }
}
