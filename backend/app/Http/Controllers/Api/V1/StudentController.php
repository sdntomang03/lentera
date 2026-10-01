<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => User::where('role', 'student')->orderBy('name')->get()
                ->map(fn (User $user) => $this->userPayload($user, true)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (is_string($request->input('username'))) {
            $request->merge(['username' => mb_strtolower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'studentName' => ['required', 'string', 'max:120', 'unique:users,name'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9_-]+$/', 'unique:users,username'],
            'school' => ['nullable', 'string', 'max:160'],
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
            'school' => $data['school'] ?? null,
            'grade_level' => $data['gradeLevel'] ?? null,
            'avatar' => $data['avatar'] ?? null,
            'progress' => $data['progress'],
            'total_points' => max(0, (int) ($data['progress']['totalPoints'] ?? 0)),
        ]);

        return response()->json(['data' => $this->userPayload($user, true)], 201);
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
        abort_unless($user->role === 'student', 404);
        if (is_string($request->input('username'))) {
            $request->merge(['username' => mb_strtolower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'studentName' => ['sometimes', 'string', 'max:120'],
            'username' => ['sometimes', 'required', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9_-]+$/', Rule::unique('users', 'username')->ignore($user->id)],
            'school' => ['nullable', 'string', 'max:160'],
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
            $data['name'] = $data['studentName'];
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

    public function destroy(User $user): JsonResponse
    {
        abort_unless($user->role === 'student', 404);
        $user->delete();

        return response()->json(['message' => 'Akun siswa berhasil dihapus.']);
    }

    private function userPayload(User $user, bool $includeProgress): array
    {
        $payload = [
            'id' => (string) $user->id,
            'studentName' => $user->name,
            'username' => $user->username,
            'school' => $user->school,
            'gradeLevel' => $user->grade_level,
            'avatar' => $user->avatar,
            'totalPoints' => $user->total_points,
        ];
        if ($includeProgress) {
            $payload = array_merge($payload, $user->progress ?? []);
            $payload['id'] = (string) $user->id;
            $payload['studentName'] = $user->name;
            $payload['username'] = $user->username;
            $payload['school'] = $user->school;
            $payload['gradeLevel'] = $user->grade_level;
            $payload['avatar'] = $user->avatar;
            $payload['totalPoints'] = $user->total_points;
        }

        return $payload;
    }
}
