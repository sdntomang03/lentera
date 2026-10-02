<?php

namespace Tests\Feature\Api\V1;

use App\Models\ContentItem;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RestApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register_login_and_save_own_progress(): void
    {
        $school = $this->createSchool();
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'school_id' => $school->id,
            'username' => 'guru_utama',
        ]);
        $registration = $this->postJson('/api/v1/auth/register', [
            'studentName' => 'Nadia Lentera',
            'username' => 'Nadia_Lentera',
            'teacherUsername' => 'guru_utama',
            'schoolCode' => $school->code,
            'gradeLevel' => 'Fase B',
            'avatar' => '👧',
            'password' => 'sandi-siswa-aman',
            'progress' => ['totalPoints' => 100, 'completedPassages' => []],
        ]);

        $registration->assertCreated()
            ->assertJsonPath('user.studentName', 'Nadia Lentera')
            ->assertJsonPath('user.username', 'nadia_lentera')
            ->assertJsonPath('user.school', $school->name)
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

        $this->withToken($registration->json('token'))->getJson('/api/v1/leaderboard')
            ->assertOk()
            ->assertJsonPath('entries.0.points', 140);

        $this->assertDatabaseHas('users', [
            'id' => $registration->json('user.id'),
            'role' => 'student',
            'teacher_id' => $teacher->id,
        ]);
    }

    public function test_student_registration_requires_a_unique_valid_username(): void
    {
        $school = $this->createSchool();
        User::factory()->create(['username' => 'taken_name']);

        $payload = [
            'studentName' => 'Siswa Baru',
            'username' => 'TAKEN_NAME',
            'schoolCode' => $school->code,
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
        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id, 'username' => 'guru_utama']);

        $created = $this->actingAs($teacher)->postJson('/api/v1/admin/students', [
            'studentName' => 'Siswa Kelola',
            'username' => 'siswa_kelas',
            'password' => 'sandi-siswa-aman',
            'gradeLevel' => 'Fase C (Kelas 5-6 SD)',
            'progress' => ['totalPoints' => 80],
        ])->assertCreated()
            ->assertJsonPath('data.username', 'siswa_kelas')
            ->assertJsonPath('data.gradeLevel', 'Fase C (Kelas 5-6 SD)');

        $studentId = $created->json('data.id');
        $this->putJson('/api/v1/admin/students/'.$studentId, [
            'studentName' => '  Nama Siswa Diperbarui  ',
            'username' => 'SISWA_BARU',
            'gradeLevel' => 'Fase A (Kelas 1-2 SD)',
            'progress' => ['totalPoints' => 80],
        ])->assertOk()
            ->assertJsonPath('data.studentName', 'Nama Siswa Diperbarui')
            ->assertJsonPath('data.username', 'siswa_baru')
            ->assertJsonPath('data.gradeLevel', 'Fase A (Kelas 1-2 SD)');

        $this->assertDatabaseHas('users', [
            'id' => $studentId,
            'name' => 'Nama Siswa Diperbarui',
            'username' => 'siswa_baru',
            'teacher_id' => $teacher->id,
            'grade_level' => 'Fase A (Kelas 1-2 SD)',
        ]);

        $this->postJson('/api/v1/admin/teachers', [
            'teacherName' => 'Guru Pendamping',
            'username' => 'guru_pendamping',
            'password' => 'password-aman',
        ])->assertCreated()
            ->assertJsonPath('data.school', $school->name);
        $this->getJson('/api/v1/admin/teachers')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_teacher_can_import_students_with_row_level_validation(): void
    {
        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id]);
        User::factory()->create(['username' => 'already_taken']);

        $response = $this->actingAs($teacher)->postJson('/api/v1/admin/students/import', [
            'students' => [
                [
                    'studentName' => 'Siswa Impor',
                    'username' => 'siswa_impor',
                    'password' => 'sandi-siswa-aman',
                    'gradeLevel' => 'Kelas 4 (Fase B)',
                ],
                [
                    'studentName' => 'Username Ganda',
                    'username' => 'already_taken',
                    'password' => 'sandi-siswa-aman',
                ],
                [
                    'studentName' => 'Username Tidak Valid',
                    'username' => 'tidak valid',
                    'password' => 'sandi-siswa-aman',
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.imported', 1)
            ->assertJsonPath('data.failed', 2)
            ->assertJsonPath('data.results.0.row', 2)
            ->assertJsonPath('data.results.0.status', 'created')
            ->assertJsonPath('data.results.1.row', 3)
            ->assertJsonPath('data.results.1.status', 'error')
            ->assertJsonPath('data.results.2.row', 4)
            ->assertJsonPath('data.results.2.status', 'error');

        $this->assertDatabaseHas('users', [
            'username' => 'siswa_impor',
            'role' => 'student',
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
            'grade_level' => 'Kelas 4 (Fase B)',
        ]);
        $this->assertDatabaseMissing('users', ['username' => 'tidak valid']);
        $this->assertStringNotContainsString('sandi-siswa-aman', $response->getContent());
    }

    public function test_student_progress_requires_points_and_keeps_database_points_in_sync(): void
    {
        $school = $this->createSchool();
        $student = User::factory()->create([
            'school_id' => $school->id,
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

        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id]);
        $this->actingAs($teacher)->postJson('/api/v1/content/passages', [
            'data' => $this->validPassagePayload('lit-test'),
        ])->assertCreated();

        $this->assertDatabaseHas('content_items', [
            'id' => 'lit-test',
            'type' => 'literacy',
        ]);
        $this->assertInstanceOf(ContentItem::class, ContentItem::find('lit-test'));
        $this->actingAs($teacher)->getJson('/api/v1/content/passages')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Bacaan Uji');
    }

    public function test_incomplete_literacy_content_is_rejected_and_legacy_invalid_content_is_hidden(): void
    {
        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id]);
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

        $this->actingAs($teacher)->getJson('/api/v1/content/passages')
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

        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $this->createSchool()->id]);
        $response = $this->actingAs($teacher)->getJson('/api/v1/content/passages')->assertOk();

        $this->assertIsArray($response->json('data'));
        $response->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'lit-z-valid');
    }

    public function test_teacher_can_manage_fase_a_reading_practice_and_students_can_read_it(): void
    {
        $payload = [
            'id' => 'read-a-bola',
            'kind' => 'syllable',
            'word' => 'bola',
            'syllables' => ['bo', 'la'],
        ];

        $this->postJson('/api/v1/content/reading-practice', ['data' => $payload])
            ->assertUnauthorized();

        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id]);
        $this->actingAs($teacher)
            ->postJson('/api/v1/content/reading-practice', ['data' => $payload])
            ->assertCreated()
            ->assertJsonPath('data.kind', 'syllable')
            ->assertJsonPath('data.syllables.1', 'la');

        $this->assertDatabaseHas('content_items', [
            'id' => 'read-a-bola',
            'type' => 'reading-practice',
        ]);

        $this->putJson('/api/v1/content/reading-practice/read-a-bola', [
            'data' => [
                'id' => 'read-a-bola',
                'kind' => 'word-image',
                'word' => 'bola',
                'image' => '⚽',
                'options' => ['⚽', '📖', '🐔', '👁️'],
            ],
        ])->assertOk()
            ->assertJsonPath('data.kind', 'word-image')
            ->assertJsonPath('data.image', '⚽');

        $this->actingAs($teacher)->getJson('/api/v1/content/reading-practice')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'read-a-bola')
            ->assertJsonPath('data.0.options.0', '⚽');

        $this->deleteJson('/api/v1/content/reading-practice/read-a-bola')->assertOk();
        $this->assertDatabaseMissing('content_items', ['id' => 'read-a-bola']);
    }

    public function test_fase_a_word_image_practice_requires_four_choices_and_answer_image(): void
    {
        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id]);
        $this->actingAs($teacher)->postJson('/api/v1/content/reading-practice', [
            'data' => [
                'id' => 'read-a-invalid',
                'kind' => 'word-image',
                'word' => 'bola',
                'image' => '⚽',
                'options' => ['⚽', '📖'],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['data.options']);
    }

    public function test_student_directory_is_not_available_without_authentication(): void
    {
        $this->getJson('/api/v1/students')->assertNotFound();
    }

    public function test_portal_settings_can_be_read_and_updated_by_teachers_only(): void
    {
        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id]);
        $this->actingAs($teacher)->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.schoolName', $school->name);

        $student = User::factory()->create(['school_id' => $school->id]);
        $this->actingAs($student)->putJson('/api/v1/settings', [
            'schoolName' => 'Sekolah Uji',
            'teacherName' => 'Guru Uji',
        ])->assertForbidden();

        $this->actingAs($teacher)->putJson('/api/v1/settings', [
            'schoolName' => 'Sekolah Uji',
            'teacherName' => 'Guru Uji',
        ])->assertOk();

        $this->assertDatabaseHas('schools', [
            'id' => $school->id,
            'name' => 'Sekolah Uji',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $teacher->id,
            'name' => 'Guru Uji',
        ]);

        $this->actingAs($teacher)->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.schoolName', 'Sekolah Uji')
            ->assertJsonPath('data.teacherName', 'Guru Uji');
    }

    public function test_teacher_can_update_only_their_own_profile_name(): void
    {
        $school = $this->createSchool();
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'school_id' => $school->id,
            'name' => 'Nama Lama',
        ]);
        $colleague = User::factory()->create([
            'role' => 'teacher',
            'school_id' => $school->id,
            'name' => 'Nama Rekan',
        ]);

        $this->actingAs($teacher)->putJson('/api/v1/me/profile', [
            'name' => '  Nama Baru  ',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Nama Baru');

        $this->assertDatabaseHas('users', ['id' => $teacher->id, 'name' => 'Nama Baru']);
        $this->assertDatabaseHas('users', ['id' => $colleague->id, 'name' => 'Nama Rekan']);
        $this->assertDatabaseHas('schools', ['id' => $school->id, 'name' => $school->name]);

        $student = User::factory()->create(['school_id' => $school->id]);
        $this->actingAs($student)->putJson('/api/v1/me/profile', ['name' => 'Bukan Guru'])
            ->assertForbidden();
    }

    public function test_teachers_only_access_their_students_and_school_content(): void
    {
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();
        $teacherA = User::factory()->create(['role' => 'teacher', 'school_id' => $schoolA->id]);
        $teacherB = User::factory()->create(['role' => 'teacher', 'school_id' => $schoolB->id]);
        $studentA = User::factory()->create(['role' => 'student', 'school_id' => $schoolA->id, 'teacher_id' => $teacherA->id]);
        $studentB = User::factory()->create(['role' => 'student', 'school_id' => $schoolB->id]);
        $otherTeacherA = User::factory()->create(['role' => 'teacher', 'school_id' => $schoolA->id]);
        $otherStudentA = User::factory()->create(['role' => 'student', 'school_id' => $schoolA->id, 'teacher_id' => $otherTeacherA->id]);
        ContentItem::create([
            'id' => 'school-a-item',
            'type' => 'literacy',
            'school_id' => $schoolA->id,
            'payload' => $this->validPassagePayload('school-a-item'),
        ]);
        ContentItem::create([
            'id' => 'school-b-item',
            'type' => 'literacy',
            'school_id' => $schoolB->id,
            'payload' => $this->validPassagePayload('school-b-item'),
        ]);

        $this->actingAs($teacherA)->getJson('/api/v1/admin/students')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $studentA->id);
        $this->actingAs($teacherA)->putJson('/api/v1/admin/students/'.$otherStudentA->id, [
            'studentName' => 'Tidak Boleh Diubah',
        ])->assertNotFound();
        $this->actingAs($teacherA)->deleteJson('/api/v1/admin/students/'.$otherStudentA->id)
            ->assertNotFound();
        $this->actingAs($otherTeacherA)->getJson('/api/v1/admin/students')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $otherStudentA->id);
        $this->actingAs($teacherA)->getJson('/api/v1/content/passages')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'school-a-item');

        $this->actingAs($teacherA)->putJson('/api/v1/admin/students/'.$studentB->id, [
            'studentName' => 'Akses Lintas Sekolah',
        ])->assertNotFound();
        $this->actingAs($teacherA)->deleteJson('/api/v1/content/passages/school-b-item')->assertNotFound();
    }

    public function test_platform_admin_can_create_school_and_first_teacher(): void
    {
        $platformAdmin = User::factory()->create(['role' => 'platform_admin', 'school_id' => null]);
        $this->actingAs($platformAdmin)->postJson('/api/v1/platform/schools', [
            'name' => 'SD Lentera Baru',
            'teacherName' => 'Guru Baru',
            'username' => 'guru_baru',
            'password' => 'password-aman',
        ])->assertCreated()
            ->assertJsonPath('data.school.name', 'SD Lentera Baru')
            ->assertJsonPath('data.teacher.username', 'guru_baru');

        $this->assertDatabaseHas('users', [
            'username' => 'guru_baru',
            'role' => 'teacher',
        ]);
        $this->getJson('/api/v1/schools/lookup/'.$this->getJson('/api/v1/platform/schools')->json('data.0.code'))
            ->assertOk();
    }

    public function test_inactive_school_cannot_register_students_or_use_school_api(): void
    {
        $school = $this->createSchool();
        $teacher = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id]);
        $school->update(['is_active' => false]);

        $this->postJson('/api/v1/auth/register', [
            'studentName' => 'Siswa Sekolah Nonaktif',
            'username' => 'siswa_nonaktif',
            'teacherUsername' => 'guru_nonaktif',
            'schoolCode' => $school->code,
            'password' => 'password-aman',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['schoolCode']);

        $this->actingAs($teacher)->getJson('/api/v1/admin/students')->assertForbidden();
        $this->postJson('/api/v1/auth/login', [
            'username' => $teacher->username,
            'password' => 'password',
            'role' => 'teacher',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['credentials']);
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

    private function createSchool(): School
    {
        return School::create([
            'name' => 'Sekolah '.Str::random(8),
            'code' => mb_strtoupper(Str::random(8)),
            'is_active' => true,
        ]);
    }
}
