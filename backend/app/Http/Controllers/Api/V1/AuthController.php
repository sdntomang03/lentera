<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        if (is_string($request->input('username'))) {
            $request->merge(['username' => mb_strtolower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'studentName' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/', 'unique:users,username'],
            'teacherUsername' => ['required', 'string', 'min:3', 'max:40'],
            'schoolCode' => ['required', 'string', 'size:8'],
            'gradeLevel' => ['nullable', 'string', 'max:80'],
            'avatar' => ['nullable', 'string', 'max:32'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
            'progress' => ['nullable', 'array'],
        ]);

        $school = School::where('code', mb_strtoupper($data['schoolCode']))
            ->where('is_active', true)
            ->first();
        if (! $school) {
            throw ValidationException::withMessages([
                'schoolCode' => ['Kode sekolah tidak ditemukan atau sekolah tidak aktif.'],
            ]);
        }

        $teacher = User::where('username', mb_strtolower(trim($data['teacherUsername'])))
            ->where('role', 'teacher')
            ->where('school_id', $school->id)
            ->first();
        if (! $teacher) {
            throw ValidationException::withMessages([
                'teacherUsername' => ['Username guru tidak ditemukan di sekolah ini.'],
            ]);
        }

        $progress = $data['progress'] ?? [];
        unset($progress['id'], $progress['studentName'], $progress['username'], $progress['school'], $progress['gradeLevel'], $progress['avatar']);
        $user = User::create([
            'name' => $data['studentName'],
            'username' => mb_strtolower($data['username']),
            'password' => $data['password'],
            'role' => 'student',
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
            'grade_level' => $data['gradeLevel'] ?? null,
            'avatar' => $data['avatar'] ?? null,
            'progress' => $progress,
            'total_points' => max(0, (int) ($data['progress']['totalPoints'] ?? 0)),
        ]);

        return response()->json($this->authenticatedResponse($user), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'role' => ['sometimes', 'in:student,teacher,platform_admin'],
        ]);

        $normalizedUsername = mb_strtolower($data['username']);
        $user = User::query()
            ->whereRaw('LOWER(username) = ?', [$normalizedUsername])
            ->when(isset($data['role']), fn ($query) => $query->where('role', $data['role']))
            ->first();

        if (
            ! $user
            || ! Hash::check($data['password'], $user->password)
            || (isset($data['role']) && $user->role !== $data['role'])
            || ($user->role !== 'platform_admin' && ! $user->school?->is_active)
        ) {
            throw ValidationException::withMessages([
                'credentials' => ['Username atau password salah.'],
            ]);
        }

        return response()->json($this->authenticatedResponse($user));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    private function authenticatedResponse(User $user): array
    {
        return [
            'token' => $user->createToken('lentera-web')->plainTextToken,
            'user' => $this->userPayload($user),
        ];
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'studentName' => $user->name,
            'school' => $user->school?->name,
            'schoolId' => $user->school_id,
            'schoolCode' => $user->school?->code,
            'gradeLevel' => $user->grade_level,
            'avatar' => $user->avatar,
            'progress' => array_merge($user->progress ?? [], [
                'totalPoints' => $user->total_points,
            ]),
        ];
    }
}
