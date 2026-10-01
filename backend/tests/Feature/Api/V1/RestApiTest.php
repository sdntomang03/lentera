<?php

namespace Tests\Feature\Api\V1;

use App\Models\ContentItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register_login_and_save_own_progress(): void
    {
        $registration = $this->postJson('/api/v1/auth/register', [
            'studentName' => 'Nadia Lentera',
            'username' => 'Nadia_Lentera',
            'school' => 'SD Nusantara',
            'gradeLevel' => 'Fase B',
            'avatar' => '👧',
            'password' => 'sandi-siswa-aman',
            'progress' => ['totalPoints' => 100, 'completedPassages' => []],
        ]);

        $registration->assertCreated()
            ->assertJsonPath('user.studentName', 'Nadia Lentera')
            ->assertJsonPath('user.username', 'nadia_lentera')
            ->assertJsonPath('user.role', 'student');

        $this->postJson('/api/v1/auth/login', [
            'username' => 'nadia_lentera',
            'password' => 'sandi-siswa-aman',
        ])->assertOk()->assertJsonPath('user.id', $registration->json('user.id'));

        $this->withToken($registration->json('token'))
            ->getJson('/api/v1/me/progress')
            ->assertOk()
            ->assertJsonPath('data.totalPoints', 100);

        $this->withToken($registration->json('token'))
            ->putJson('/api/v1/me/progress', [
                'progress' => ['username' => 'nama_lain', 'totalPoints' => 140, 'completedPassages' => ['lit-001']],
            ])
            ->assertOk()
            ->assertJsonPath('data.totalPoints', 140)
            ->assertJsonPath('data.username', 'nadia_lentera');

        $this->assertDatabaseHas('users', [
            'id' => $registration->json('user.id'),
            'total_points' => 140,
        ]);

        $this->getJson('/api/v1/leaderboard')
            ->assertOk()
            ->assertJsonPath('entries.0.points', 140);

        $this->assertDatabaseHas('users', [
            'id' => $registration->json('user.id'),
            'role' => 'student',
        ]);
    }

    public function test_student_registration_requires_a_unique_valid_username(): void
    {
        User::factory()->create(['username' => 'taken_name']);

        $payload = [
            'studentName' => 'Siswa Baru',
            'username' => 'TAKEN_NAME',
            'password' => 'sandi-siswa-aman',
        ];

        $this->postJson('/api/v1/auth/register', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);

        $payload['username'] = 'invalid name';
        $this->postJson('/api/v1/auth/register', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);

        unset($payload['username']);
        $this->postJson('/api/v1/auth/register', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);
    }

    public function test_teacher_can_create_and_update_student_username(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $created = $this->actingAs($teacher)->postJson('/api/v1/admin/students', [
            'studentName' => 'Siswa Kelola',
            'username' => 'siswa_kelas',
            'password' => 'sandi-siswa-aman',
            'progress' => ['totalPoints' => 80],
        ])->assertCreated()
            ->assertJsonPath('data.username', 'siswa_kelas');

        $studentId = $created->json('data.id');
        $this->putJson('/api/v1/admin/students/'.$studentId, [
            'username' => 'SISWA_BARU',
            'progress' => ['totalPoints' => 80],
        ])->assertOk()
            ->assertJsonPath('data.username', 'siswa_baru');

        $this->assertDatabaseHas('users', [
            'id' => $studentId,
            'username' => 'siswa_baru',
        ]);
    }

    public function test_student_progress_requires_points_and_keeps_database_points_in_sync(): void
    {
        $student = User::factory()->create([
            'progress' => ['totalPoints' => 50],
            'total_points' => 50,
        ]);

        $this->actingAs($student)->putJson('/api/v1/me/progress', [
            'progress' => ['completedPassages' => ['lit-001']],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['progress.totalPoints']);

        $this->assertDatabaseHas('users', [
            'id' => $student->id,
            'total_points' => 50,
        ]);
    }

    public function test_only_teachers_can_manage_content(): void
    {
        $this->postJson('/api/v1/content/passages', ['data' => ['id' => 'lit-test']])
            ->assertUnauthorized();

        $student = User::factory()->create();
        $this->actingAs($student)->postJson('/api/v1/content/passages', [
            'data' => ['id' => 'lit-test'],
        ])->assertForbidden();

        $teacher = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($teacher)->postJson('/api/v1/content/passages', [
            'data' => $this->validPassagePayload('lit-test'),
        ])->assertCreated();

        $this->assertDatabaseHas('content_items', [
            'id' => 'lit-test',
            'type' => 'literacy',
        ]);
        $this->assertInstanceOf(ContentItem::class, ContentItem::find('lit-test'));
        $this->getJson('/api/v1/content/passages')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Bacaan Uji');
    }

    public function test_incomplete_literacy_content_is_rejected_and_legacy_invalid_content_is_hidden(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($teacher)->postJson('/api/v1/content/passages', [
            'data' => [
                'id' => 'lit-incomplete',
                'title' => 'Bacaan Tidak Lengkap',
                'level' => 'fase-b',
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['data.paragraphs', 'data.vocabulary', 'data.questions']);

        ContentItem::create([
            'id' => 'lit-legacy-incomplete',
            'type' => 'literacy',
            'payload' => [
                'id' => 'lit-legacy-incomplete',
                'title' => 'Bacaan Lama Tidak Lengkap',
                'level' => 'fase-b',
            ],
        ]);

        $this->getJson('/api/v1/content/passages')
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }

    public function test_literacy_content_response_remains_a_json_array_when_invalid_rows_are_filtered(): void
    {
        ContentItem::create([
            'id' => 'lit-a-incomplete',
            'type' => 'literacy',
            'payload' => ['id' => 'lit-a-incomplete', 'title' => 'Tidak lengkap'],
        ]);
        ContentItem::create([
            'id' => 'lit-z-valid',
            'type' => 'literacy',
            'payload' => $this->validPassagePayload('lit-z-valid'),
        ]);

        $response = $this->getJson('/api/v1/content/passages')->assertOk();

        $this->assertIsArray($response->json('data'));
        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'lit-z-valid');
    }

    public function test_student_directory_is_not_available_without_authentication(): void
    {
        $this->getJson('/api/v1/students')->assertNotFound();
    }

    public function test_portal_settings_can_be_read_and_updated_by_teachers_only(): void
    {
        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.schoolName', 'SD Negeri Nusantara');

        $student = User::factory()->create();
        $this->actingAs($student)->putJson('/api/v1/settings', [
            'schoolName' => 'Sekolah Uji',
            'teacherName' => 'Guru Uji',
        ])->assertForbidden();

        $teacher = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($teacher)->putJson('/api/v1/settings', [
            'schoolName' => 'Sekolah Uji',
            'teacherName' => 'Guru Uji',
        ])->assertOk();

        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.schoolName', 'Sekolah Uji')
            ->assertJsonPath('data.teacherName', 'Guru Uji');
    }

    private function validPassagePayload(string $id): array
    {
        return [
            'id' => $id,
            'title' => 'Bacaan Uji',
            'level' => 'fase-a',
            'levelLabel' => 'Fase A (Kelas 1-2 SD)',
            'genre' => 'informasi',
            'genreLabel' => 'Teks Informasi',
            'estimatedReadTimeMinutes' => 1,
            'wordCount' => 10,
            'summary' => 'Ringkasan bacaan uji.',
            'paragraphs' => ['Isi bacaan uji.'],
            'vocabulary' => [],
            'questions' => [],
            'authorOrSource' => 'Guru Uji',
        ];
    }
}
