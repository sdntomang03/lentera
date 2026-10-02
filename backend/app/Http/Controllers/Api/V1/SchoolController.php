<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SchoolController extends Controller
{
    public function lookup(string $code): JsonResponse
    {
        $school = School::where('code', mb_strtoupper($code))->where('is_active', true)->first();
        abort_unless($school, 404, 'Kode sekolah tidak ditemukan atau sekolah tidak aktif.');

        return response()->json(['data' => ['id' => $school->id, 'name' => $school->name, 'code' => $school->code]]);
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => School::withCount([
                'users as student_count' => fn ($query) => $query->where('role', 'student'),
                'users as teacher_count' => fn ($query) => $query->where('role', 'teacher'),
            ])->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (is_string($request->input('username'))) {
            $request->merge(['username' => mb_strtolower(trim($request->input('username')))]);
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160', 'unique:schools,name'],
            'teacherName' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9_-]+$/', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ]);

        [$school, $teacher] = DB::transaction(function () use ($data): array {
            do {
                $code = mb_strtoupper(Str::random(8));
            } while (School::where('code', $code)->exists());

            $school = School::create([
                'name' => $data['name'],
                'code' => $code,
                'is_active' => true,
            ]);
            $teacher = User::create([
                'name' => $data['teacherName'],
                'username' => $data['username'],
                'password' => $data['password'],
                'role' => 'teacher',
                'school_id' => $school->id,
            ]);

            return [$school, $teacher];
        });

        return response()->json([
            'data' => [
                'school' => $school,
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'username' => $teacher->username,
                ],
            ],
        ], 201);
    }

    public function update(Request $request, School $school): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:160', Rule::unique('schools', 'name')->ignore($school->id)],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);
        $school->update($data);

        return response()->json(['data' => $school->refresh()]);
    }
}
