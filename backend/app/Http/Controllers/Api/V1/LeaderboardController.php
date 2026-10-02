<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Papan peringkat hanya tersedia untuk akun sekolah.');
        $entries = User::where('role', 'student')->where('school_id', $schoolId)->get()
            ->map(function (User $user): array {
                $progress = $user->progress ?? [];
                $completed = count($progress['completedPassages'] ?? [])
                    + count($progress['completedNumeracy'] ?? []);

                return [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'school' => $user->school?->name ?? '',
                    'city' => '',
                    'level' => $this->levelCode($user->grade_level),
                    'levelLabel' => $user->grade_level ?? '',
                    'points' => $user->total_points,
                    'badgesCount' => count($progress['earnedBadges'] ?? []),
                    'activitiesCompleted' => $completed,
                    'avatar' => $user->avatar ?? '⭐',
                    'streakDays' => (int) ($progress['streakCount'] ?? 0),
                    'trend' => 'same',
                ];
            })
            ->sortByDesc('points')
            ->values()
            ->map(fn (array $entry, int $index): array => array_merge($entry, ['rank' => $index + 1]));

        $level = $request->query('level');
        if (in_array($level, ['fase-a', 'fase-b', 'fase-c'], true)) {
            $entries = $entries->where('level', $level)->values();
        }
        $query = trim((string) $request->query('q', ''));
        if ($query !== '') {
            $entries = $entries->filter(fn (array $entry) => str_contains(mb_strtolower($entry['name'].' '.$entry['school']), mb_strtolower($query))
            )->values();
        }

        return response()->json(['entries' => $entries]);
    }

    private function levelCode(?string $gradeLevel): string
    {
        $level = mb_strtolower($gradeLevel ?? '');
        if (str_contains($level, 'fase a') || preg_match('/kelas\s*[1-2]\b/', $level)) {
            return 'fase-a';
        }
        if (str_contains($level, 'fase b') || preg_match('/kelas\s*[3-4]\b/', $level)) {
            return 'fase-b';
        }

        return 'fase-c';
    }
}
