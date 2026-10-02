<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');

        return response()->json([
            'data' => User::where('role', 'student')
                ->where('school_id', $schoolId)
                ->where('teacher_id', $request->user()->id)
                ->orderBy('name')->get()
                ->map(fn (User $user) => $this->userPayload($user, true)),
        ]);
    }

    public function indexTeachers(Request $request): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');

        return response()->json([
            'data' => User::where('role', 'teacher')->where('school_id', $schoolId)->orderBy('name')
                ->get(['id', 'name', 'username', 'school_id'])
                ->map(fn (User $user) => [
                    'id' => (string) $user->id,
                    'teacherName' => $user->name,
                    'username' => $user->username,
                    'school' => $request->user()->school?->name,
                ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');
        if (is_string($request->input('username'))) {
            $request->merge(['username' => mb_strtolower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'studentName' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9_-]+$/', 'unique:users,username'],
            'gradeLevel' => ['nullable', 'string', 'max:80'],
            'avatar' => ['nullable', 'string', 'max:32'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
            'progress' => ['required', 'array'],
            'progress.totalPoints' => ['required', 'integer', 'min:0'],
        ]);
        $user = User::create([
            'name' => $data['studentName'],
            'username' => $data['username'],
            'password' => $data['password'],
            'role' => 'student',
            'school_id' => $schoolId,
            'teacher_id' => $request->user()->id,
            'grade_level' => $data['gradeLevel'] ?? null,
            'avatar' => $data['avatar'] ?? null,
            'progress' => $data['progress'],
            'total_points' => max(0, (int) ($data['progress']['totalPoints'] ?? 0)),
        ]);

        return response()->json(['data' => $this->userPayload($user, true)], 201);
    }

    public function import(Request $request): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');

        $request->validate([
            'students' => ['required', 'array', 'list', 'min:1', 'max:100'],
        ]);

        $results = [];
        foreach ($request->input('students') as $index => $student) {
            $rowNumber = $index + 2;
            if (! is_array($student)) {
                $results[] = [
                    'row' => $rowNumber,
                    'status' => 'error',
                    'message' => 'Data baris tidak valid.',
                ];

                continue;
            }

            if (is_string($student['username'] ?? null)) {
                $student['username'] = mb_strtolower(trim($student['username']));
            }
            $validator = Validator::make($student, [
                'studentName' => ['required', 'string', 'max:120'],
                'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9_-]+$/', 'unique:users,username'],
                'password' => ['required', 'string', 'min:8', 'max:72'],
                'gradeLevel' => ['nullable', 'string', 'max:80'],
            ]);

            if ($validator->fails()) {
                $results[] = [
                    'row' => $rowNumber,
                    'username' => $student['username'] ?? null,
                    'status' => 'error',
                    'message' => $validator->errors()->first(),
                ];

                continue;
            }

            $data = $validator->validated();
            $user = User::create([
                'name' => trim($data['studentName']),
                'username' => $data['username'],
                'password' => $data['password'],
                'role' => 'student',
                'school_id' => $schoolId,
                'teacher_id' => $request->user()->id,
                'grade_level' => $data['gradeLevel'] ?? null,
                'progress' => [
                    'completedPassages' => [],
                    'completedNumeracy' => [],
                    'quizScores' => [],
                    'earnedBadges' => [],
                    'totalPoints' => 0,
                    'streakCount' => 0,
                    'longestStreak' => 0,
                ],
                'total_points' => 0,
            ]);

            $results[] = [
                'row' => $rowNumber,
                'username' => $user->username,
                'status' => 'created',
                'studentId' => (string) $user->id,
            ];
        }

        $imported = count(array_filter($results, fn (array $result): bool => $result['status'] === 'created'));

        return response()->json([
            'data' => [
                'imported' => $imported,
                'failed' => count($results) - $imported,
                'results' => $results,
            ],
        ]);
    }

    public function storeTeacher(Request $request): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');
        if (is_string($request->input('username'))) {
            $request->merge(['username' => mb_strtolower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'teacherName' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9_-]+$/', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ]);
        $teacher = User::create([
            'name' => $data['teacherName'],
            'username' => $data['username'],
            'password' => $data['password'],
            'role' => 'teacher',
            'school_id' => $schoolId,
        ]);

        return response()->json([
            'data' => [
                'id' => (string) $teacher->id,
                'teacherName' => $teacher->name,
                'username' => $teacher->username,
                'school' => $request->user()->school?->name,
            ],
        ], 201);
    }

    public function showOwnProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'student', 403);

        return response()->json(['data' => $this->userPayload($user, true)]);
    }

    public function saveOwnProgress(Request $request): JsonResponse
    {
        $data = $request->validate([
            'progress' => ['required', 'array'],
            'progress.totalPoints' => ['required', 'integer', 'min:0'],
        ]);
        $user = $request->user();
        abort_unless($user->role === 'student', 403);
        $progress = $data['progress'];
        unset($progress['id'], $progress['studentName'], $progress['username'], $progress['school'], $progress['gradeLevel'], $progress['avatar']);
        $user->update([
            'progress' => $progress,
            'total_points' => $data['progress']['totalPoints'],
        ]);

        return response()->json(['data' => $this->userPayload($user->refresh(), true)]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_unless(
            $user->role === 'student'
            && $user->school_id === $request->user()->school_id
            && $user->teacher_id === $request->user()->id,
            404,
        );
        if (is_string($request->input('username'))) {
            $request->merge(['username' => mb_strtolower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'studentName' => ['sometimes', 'required', 'string', 'max:120'],
            'username' => ['sometimes', 'required', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9_-]+$/', Rule::unique('users', 'username')->ignore($user->id)],
            'gradeLevel' => ['nullable', 'string', 'max:80'],
            'avatar' => ['nullable', 'string', 'max:32'],
            'progress' => ['sometimes', 'array'],
            'progress.totalPoints' => ['required_with:progress', 'integer', 'min:0'],
        ]);
        if (! isset($data['progress'])) {
            $data['progress'] = array_intersect_key($request->all(), array_flip([
                'completedPassages', 'completedNumeracy', 'quizScores', 'earnedBadges',
                'totalPoints', 'readingSpeedRecord', 'streakCount', 'lastActiveDate',
                'longestStreak', 'streakBonusPointsEarned', 'activityHistoryDates',
                'dailyChallenge', 'createdAt', 'updatedAt',
            ]));
        }
        if (array_key_exists('studentName', $data)) {
            $data['name'] = trim($data['studentName']);
            unset($data['studentName']);
        }
        if (array_key_exists('gradeLevel', $data)) {
            $data['grade_level'] = $data['gradeLevel'];
            unset($data['gradeLevel']);
        }
        if (isset($data['progress'])) {
            $data['total_points'] = $data['progress']['totalPoints'];
        }
        $user->update($data);

        return response()->json(['data' => $this->userPayload($user->refresh(), true)]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless(
            $user->role === 'student'
            && $user->school_id === $request->user()->school_id
            && $user->teacher_id === $request->user()->id,
            404,
        );
        $user->delete();

        return response()->json(['message' => 'Akun siswa berhasil dihapus.']);
    }

    private function userPayload(User $user, bool $includeProgress): array
    {
        $payload = [
            'id' => (string) $user->id,
            'studentName' => $user->name,
            'username' => $user->username,
            'school' => $user->school?->name,
            'gradeLevel' => $user->grade_level,
            'avatar' => $user->avatar,
            'totalPoints' => $user->total_points,
        ];
        if ($includeProgress) {
            $payload = array_merge($payload, $user->progress ?? []);
            $payload['id'] = (string) $user->id;
            $payload['studentName'] = $user->name;
            $payload['username'] = $user->username;
            $payload['school'] = $user->school?->name;
            $payload['gradeLevel'] = $user->grade_level;
            $payload['avatar'] = $user->avatar;
            $payload['totalPoints'] = $user->total_points;
        }

        return $payload;
    }
}
