<?php

namespace Tests\Feature\Api\V1;

use App\Models\FcmDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class FcmDeviceRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tirta_can_register_and_refresh_a_device_fcm_token_without_an_account(): void
    {
        $deviceId = (string) Str::uuid();

        $this->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => $deviceId,
            'token' => 'fcm-token-initial',
            'platform' => 'android',
        ])->assertOk()
            ->assertJsonPath('deviceId', $deviceId)
            ->assertJsonMissingPath('token');

        $this->assertSame('fcm-token-initial', FcmDevice::where('device_id', $deviceId)->firstOrFail()->token);
        $this->assertNotSame(
            'fcm-token-initial',
            DB::table('fcm_devices')->where('device_id', $deviceId)->value('token'),
        );
        $this->assertDatabaseHas('fcm_devices', [
            'device_id' => $deviceId,
            'platform' => 'android',
        ]);

        $this->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => $deviceId,
            'token' => 'fcm-token-refreshed',
            'platform' => 'android',
        ])->assertOk()
            ->assertJsonMissingPath('token');

        $this->assertDatabaseCount('fcm_devices', 1);
        $this->assertSame('fcm-token-refreshed', FcmDevice::where('device_id', $deviceId)->firstOrFail()->token);
    }

    public function test_fcm_device_registration_validates_all_fields(): void
    {
        $this->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => 'not-a-uuid',
            'token' => '',
            'platform' => 'unknown',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['deviceId', 'token', 'platform']);

        $this->assertDatabaseCount('fcm_devices', 0);
    }

    public function test_capacitor_apps_can_call_the_registration_endpoint_cross_origin(): void
    {
        $this->withHeaders([
            'Origin' => 'https://localhost',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type',
        ])->options('/api/v1/devices/fcm-token')
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'https://localhost');
    }
}
