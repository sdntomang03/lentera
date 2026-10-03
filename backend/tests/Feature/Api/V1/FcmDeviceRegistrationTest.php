<?php

namespace Tests\Feature\Api\V1;

use App\Models\FcmDevice;
use App\Models\User;
use App\Services\FcmMessageSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class FcmDeviceRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_platform_admin_can_list_fcm_devices_with_decrypted_tokens_and_usernames(): void
    {
        $user = User::factory()->create(['username' => 'tirta_user']);
        FcmDevice::create([
            'user_id' => $user->id,
            'username' => $user->username,
            'device_id' => (string) Str::uuid(),
            'token' => 'usable-fcm-token',
            'platform' => 'android',
        ]);

        $this->getJson('/api/v1/platform/fcm-devices')->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => 'teacher']))
            ->getJson('/api/v1/platform/fcm-devices')
            ->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => 'platform_admin']))
            ->getJson('/api/v1/platform/fcm-devices')
            ->assertOk()
            ->assertJsonPath('data.0.username', 'tirta_user')
            ->assertJsonPath('data.0.token', 'usable-fcm-token')
            ->assertJsonPath('data.0.platform', 'android')
            ->assertJsonPath('total', 1);
    }

    public function test_fcm_device_list_uses_account_username_for_legacy_device_records(): void
    {
        $user = User::factory()->create(['username' => 'legacy_user']);
        FcmDevice::create([
            'user_id' => $user->id,
            'username' => null,
            'device_id' => (string) Str::uuid(),
            'token' => 'legacy-usable-token',
            'platform' => 'android',
        ]);

        $this->actingAs(User::factory()->create(['role' => 'platform_admin']))
            ->getJson('/api/v1/platform/fcm-devices')
            ->assertOk()
            ->assertJsonPath('data.0.username', 'legacy_user');
    }

    public function test_only_platform_admin_can_delete_a_fcm_device_registration(): void
    {
        $device = FcmDevice::create([
            'user_id' => User::factory()->create()->id,
            'username' => 'tirta_user',
            'device_id' => (string) Str::uuid(),
            'token' => 'private-device-token',
            'platform' => 'android',
        ]);

        $this->deleteJson('/api/v1/platform/fcm-devices/'.$device->id)->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => 'teacher']))
            ->deleteJson('/api/v1/platform/fcm-devices/'.$device->id)
            ->assertForbidden();
        $this->assertDatabaseHas('fcm_devices', ['id' => $device->id]);

        $this->actingAs(User::factory()->create(['role' => 'platform_admin']))
            ->deleteJson('/api/v1/platform/fcm-devices/'.$device->id)
            ->assertOk()
            ->assertJsonPath('message', 'Pendaftaran perangkat FCM berhasil dihapus.');

        $this->assertDatabaseMissing('fcm_devices', ['id' => $device->id]);
    }

    public function test_platform_admin_gets_not_found_when_deleting_a_missing_fcm_device(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'platform_admin']))
            ->deleteJson('/api/v1/platform/fcm-devices/999')
            ->assertNotFound();
    }

    public function test_only_platform_admin_can_send_fcm_notifications(): void
    {
        $payload = [
            'recipient' => 'all',
            'title' => 'Pengingat Tirta',
            'body' => 'Saatnya minum air putih.',
        ];

        $this->postJson('/api/v1/platform/fcm-notifications', $payload)->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => 'teacher']))
            ->postJson('/api/v1/platform/fcm-notifications', $payload)
            ->assertForbidden();
    }

    public function test_platform_admin_can_send_a_notification_to_all_registered_devices(): void
    {
        $device = FcmDevice::create([
            'user_id' => User::factory()->create()->id,
            'username' => 'tirta_user',
            'device_id' => (string) Str::uuid(),
            'token' => 'device-token-one',
            'platform' => 'android',
        ]);
        $this->mock(FcmMessageSender::class)
            ->shouldReceive('send')
            ->once()
            ->with(['device-token-one'], 'Pengingat Tirta', 'Saatnya minum air putih.')
            ->andReturn([
                'successCount' => 1,
                'failureCount' => 0,
                'invalidTokens' => [],
            ]);

        $this->actingAs(User::factory()->create(['role' => 'platform_admin']))
            ->postJson('/api/v1/platform/fcm-notifications', [
                'recipient' => 'all',
                'title' => 'Pengingat Tirta',
                'body' => 'Saatnya minum air putih.',
            ])
            ->assertOk()
            ->assertJsonPath('successCount', 1)
            ->assertJsonPath('failureCount', 0)
            ->assertJsonPath('recipientCount', 1);

        $this->assertDatabaseHas('fcm_devices', ['id' => $device->id]);
    }

    public function test_platform_admin_can_send_a_notification_to_one_username_and_remove_invalid_tokens(): void
    {
        $targetUser = User::factory()->create(['username' => 'target_user']);
        $otherUser = User::factory()->create(['username' => 'other_user']);
        $targetDevice = FcmDevice::create([
            'user_id' => $targetUser->id,
            'username' => $targetUser->username,
            'device_id' => (string) Str::uuid(),
            'token' => 'target-invalid-token',
            'platform' => 'android',
        ]);
        $otherDevice = FcmDevice::create([
            'user_id' => $otherUser->id,
            'username' => $otherUser->username,
            'device_id' => (string) Str::uuid(),
            'token' => 'other-token',
            'platform' => 'android',
        ]);
        $this->mock(FcmMessageSender::class)
            ->shouldReceive('send')
            ->once()
            ->with(['target-invalid-token'], 'Judul', 'Isi pesan')
            ->andReturn([
                'successCount' => 0,
                'failureCount' => 1,
                'invalidTokens' => ['target-invalid-token'],
            ]);

        $this->actingAs(User::factory()->create(['role' => 'platform_admin']))
            ->postJson('/api/v1/platform/fcm-notifications', [
                'recipient' => 'username',
                'username' => 'target_user',
                'title' => 'Judul',
                'body' => 'Isi pesan',
            ])
            ->assertOk()
            ->assertJsonPath('successCount', 0)
            ->assertJsonPath('failureCount', 1)
            ->assertJsonPath('invalidDeviceCount', 1)
            ->assertJsonPath('recipientCount', 1);

        $this->assertDatabaseMissing('fcm_devices', ['id' => $targetDevice->id]);
        $this->assertSame('other-token', FcmDevice::findOrFail($otherDevice->id)->token);
    }

    public function test_fcm_notification_requires_valid_fields_and_a_registered_recipient(): void
    {
        $admin = User::factory()->create(['role' => 'platform_admin']);
        $this->actingAs($admin)->postJson('/api/v1/platform/fcm-notifications', [
            'recipient' => 'username',
            'username' => '',
            'title' => str_repeat('x', 121),
            'body' => '',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['username', 'title', 'body']);

        $this->postJson('/api/v1/platform/fcm-notifications', [
            'recipient' => 'username',
            'username' => 'no_device',
            'title' => 'Judul',
            'body' => 'Pesan',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Tidak ditemukan perangkat FCM untuk username tersebut.');
    }

    public function test_fcm_send_failure_returns_a_safe_error_without_exposing_credentials(): void
    {
        FcmDevice::create([
            'user_id' => User::factory()->create()->id,
            'username' => 'tirta_user',
            'device_id' => (string) Str::uuid(),
            'token' => 'device-token-one',
            'platform' => 'android',
        ]);

        $this->mock(FcmMessageSender::class)
            ->shouldReceive('send')
            ->once()
            ->andThrow(new \RuntimeException('Private service account details'));

        $this->actingAs(User::factory()->create(['role' => 'platform_admin']))
            ->postJson('/api/v1/platform/fcm-notifications', [
                'recipient' => 'all',
                'title' => 'Judul',
                'body' => 'Pesan',
            ])
            ->assertStatus(502)
            ->assertJsonPath(
                'message',
                'Notifikasi gagal dikirim. Periksa konfigurasi Firebase Admin SDK di server.',
            )
            ->assertDontSee('Private service account details');
    }

    public function test_tirta_can_register_and_refresh_a_device_fcm_token_without_an_account(): void
    {
        $deviceId = (string) Str::uuid();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => $deviceId,
            'token' => 'fcm-token-initial',
            'platform' => 'android',
            'username' => $user->username,
        ])->assertOk()
            ->assertJsonPath('deviceId', $deviceId)
            ->assertJsonPath('username', $user->username)
            ->assertJsonMissingPath('token');

        $this->assertSame('fcm-token-initial', FcmDevice::where('device_id', $deviceId)->firstOrFail()->token);
        $this->assertNotSame(
            'fcm-token-initial',
            DB::table('fcm_devices')->where('device_id', $deviceId)->value('token'),
        );
        $this->assertDatabaseHas('fcm_devices', [
            'user_id' => $user->id,
            'username' => $user->username,
            'device_id' => $deviceId,
            'platform' => 'android',
        ]);

        $this->actingAs($user)->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => $deviceId,
            'token' => 'fcm-token-refreshed',
            'platform' => 'android',
            'username' => $user->username,
        ])->assertOk()
            ->assertJsonMissingPath('token');

        $this->assertDatabaseCount('fcm_devices', 1);
        $this->assertSame('fcm-token-refreshed', FcmDevice::where('device_id', $deviceId)->firstOrFail()->token);
    }

    public function test_fcm_device_registration_rejects_a_username_that_does_not_match_the_authenticated_user(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => (string) Str::uuid(),
            'token' => 'fcm-token',
            'platform' => 'android',
            'username' => 'someone-else',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);

        $this->assertDatabaseCount('fcm_devices', 0);
    }

    public function test_legacy_fcm_registration_stores_the_authenticated_username(): void
    {
        $user = User::factory()->create();
        $deviceId = (string) Str::uuid();

        $this->actingAs($user)->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => $deviceId,
            'token' => 'legacy-fcm-token',
            'platform' => 'android',
        ])->assertOk()
            ->assertJsonPath('username', $user->username);

        $this->assertDatabaseHas('fcm_devices', [
            'device_id' => $deviceId,
            'username' => $user->username,
        ]);
    }

    public function test_username_migration_preserves_legacy_devices_without_user_id(): void
    {
        $originalConnection = DB::getDefaultConnection();
        $connectionConfig = config('database.connections.sqlite');
        $connectionConfig['database'] = ':memory:';
        config(['database.connections.fcm_migration_test' => $connectionConfig]);
        DB::purge('fcm_migration_test');
        DB::setDefaultConnection('fcm_migration_test');

        try {
            Schema::create('users', function ($table): void {
                $table->id();
                $table->string('username')->unique();
            });
            Schema::create('fcm_devices', function ($table): void {
                $table->id();
                $table->uuid('device_id')->unique();
                $table->text('token');
                $table->string('platform', 16);
                $table->timestamps();
            });

            $deviceId = (string) Str::uuid();
            DB::table('fcm_devices')->insert([
                'device_id' => $deviceId,
                'token' => 'encrypted-legacy-token',
                'platform' => 'android',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $migration = require database_path('migrations/2026_10_03_080000_add_username_to_fcm_devices_table.php');
            $migration->up();

            $this->assertTrue(Schema::hasColumn('fcm_devices', 'user_id'));
            $this->assertTrue(Schema::hasColumn('fcm_devices', 'username'));
            $this->assertDatabaseHas('fcm_devices', [
                'device_id' => $deviceId,
                'token' => 'encrypted-legacy-token',
                'username' => null,
                'user_id' => null,
            ]);
        } finally {
            DB::setDefaultConnection($originalConnection);
            DB::purge('fcm_migration_test');
        }
    }

    public function test_fcm_device_registration_validates_all_fields(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => 'not-a-uuid',
            'token' => '',
            'platform' => 'unknown',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['deviceId', 'token', 'platform']);

        $this->assertDatabaseCount('fcm_devices', 0);
    }

    public function test_fcm_device_registration_requires_an_authenticated_user(): void
    {
        $this->postJson('/api/v1/devices/fcm-token', [
            'deviceId' => (string) Str::uuid(),
            'token' => 'fcm-token',
            'platform' => 'android',
        ])->assertUnauthorized();

        $this->assertDatabaseCount('fcm_devices', 0);
    }

    public function test_user_can_only_unregister_their_own_device(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $device = FcmDevice::create([
            'user_id' => $owner->id,
            'device_id' => (string) Str::uuid(),
            'token' => 'private-device-token',
            'platform' => 'android',
        ]);

        $this->actingAs($otherUser)->deleteJson('/api/v1/devices/fcm-token', [
            'deviceId' => $device->device_id,
        ])->assertOk();

        $this->assertDatabaseHas('fcm_devices', ['id' => $device->id]);

        $this->actingAs($owner)->deleteJson('/api/v1/devices/fcm-token', [
            'deviceId' => $device->device_id,
        ])->assertOk();

        $this->assertDatabaseMissing('fcm_devices', ['id' => $device->id]);
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
