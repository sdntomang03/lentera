<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
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
            'studentName' => ['required', 'string', 'max:120', 'unique:users,name'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/', 'unique:users,username'],
            'school' => ['nullable', 'string', 'max:160'],
            'gradeLevel' => ['nullable', 'string', 'max:80'],
            'avatar' => ['nullable', 'string', 'max:32'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
            'progress' => ['nullable', 'array'],
        ]);

        $user = User::create([
            'name' => $data['studentName'],
            'username' => mb_strtolower($data['username']),
            'password' => $data['password'],
            'role' => 'student',
            'school' => $data['school'] ?? null,
            'grade_level' => $data['gradeLevel'] ?? null,
            'avatar' => $data['avatar'] ?? null,
            'progress' => $data['progress'] ?? [],
            'total_points' => max(0, (int) ($data['progress']['totalPoints'] ?? 0)),
        ]);

        return response()->json($this->authenticatedResponse($user), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'role' => ['sometimes', 'in:student,teacher'],
        ]);

        $normalizedUsername = mb_strtolower($data['username']);
        $user = User::query()
            ->where(function ($query) use ($normalizedUsername) {
                $query->whereRaw('LOWER(username) = ?', [$normalizedUsername])
                    ->orWhereRaw('LOWER(name) = ?', [$normalizedUsername]);
            })
            ->when(isset($data['role']), fn ($query) => $query->where('role', $data['role']))
            ->orderByRaw('CASE WHEN LOWER(username) = ? THEN 0 ELSE 1 END', [$normalizedUsername])
            ->first();

        if (
            ! $user
            || ! Hash::check($data['password'], $user->password)
            || (isset($data['role']) && $user->role !== $data['role'])
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
            'school' => $user->school,
            'gradeLevel' => $user->grade_level,
            'avatar' => $user->avatar,
            'progress' => array_merge($user->progress ?? [], [
                'totalPoints' => $user->total_points,
            ]),
        ];
    }
}
