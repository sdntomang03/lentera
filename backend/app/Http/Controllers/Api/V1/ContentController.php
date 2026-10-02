<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function index(Request $request, string $type): JsonResponse
    {
        $kind = $this->contentKind($type);
        $items = ContentItem::where('type', $kind)
            ->where(function (Builder $query) use ($request): void {
                $query->whereNull('school_id');
                if ($request->user()->school_id) {
                    $query->orWhere('school_id', $request->user()->school_id);
                }
            })
            ->orderBy('id')->get()
            ->filter(fn (ContentItem $item) => $this->isValidPayload($item->payload, $type))
            ->values()
            ->map(fn (ContentItem $item) => array_merge($item->payload, ['id' => $item->id]));

        return response()->json(['data' => $items]);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $payload = $request->validate($this->contentRules($type))['data'];
        $id = $payload['id'];
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');
        $item = ContentItem::create([
            'id' => $id,
            'type' => $this->contentKind($type),
            'school_id' => $schoolId,
            'payload' => $payload,
        ]);

        return response()->json(['data' => array_merge($item->payload, ['id' => $item->id])], 201);
    }

    public function update(Request $request, string $type, string $id): JsonResponse
    {
        $payload = $request->validate($this->contentRules($type))['data'];
        abort_if($payload['id'] !== $id, 422, 'ID konten pada path dan data harus sama.');
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');
        $item = ContentItem::where('type', $this->contentKind($type))
            ->where('school_id', $schoolId)
            ->findOrFail($id);
        $item->update(['payload' => array_merge($payload, ['id' => $id])]);

        return response()->json(['data' => array_merge($item->payload, ['id' => $id])]);
    }

    public function destroy(Request $request, string $type, string $id): JsonResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($schoolId, 403, 'Akun guru belum terhubung ke sekolah.');
        ContentItem::where('type', $this->contentKind($type))
            ->where('school_id', $schoolId)
            ->findOrFail($id)->delete();

        return response()->json(['message' => 'Konten berhasil dihapus.']);
    }

    private function contentRules(string $type): array
    {
        if ($type === 'reading-practice') {
            return [
                'data' => ['required', 'array'],
                'data.id' => ['required', 'string', 'max:128'],
                'data.kind' => ['required', 'in:syllable,word-image,sentence'],
                'data.word' => ['required_if:data.kind,syllable,word-image', 'nullable', 'string', 'max:80'],
                'data.syllables' => ['required_if:data.kind,syllable', 'array', 'min:2'],
                'data.syllables.*' => ['required', 'string', 'max:30'],
                'data.image' => ['required_if:data.kind,word-image,sentence', 'nullable', 'string', 'max:32'],
                'data.options' => ['required_if:data.kind,word-image', 'array', 'size:4'],
                'data.options.*' => ['required', 'string', 'max:32'],
                'data.sentence' => ['required_if:data.kind,sentence', 'nullable', 'string', 'max:180'],
            ];
        }

        $rules = [
            'data' => ['required', 'array'],
            'data.id' => ['required', 'string', 'max:128'],
            'data.title' => ['required', 'string', 'max:255'],
            'data.level' => ['required', 'in:fase-a,fase-b,fase-c'],
        ];

        if ($type === 'passages') {
            return array_merge($rules, [
                'data.levelLabel' => ['required', 'string'],
                'data.genre' => ['required', 'string'],
                'data.genreLabel' => ['required', 'string'],
                'data.estimatedReadTimeMinutes' => ['required', 'numeric', 'min:0'],
                'data.wordCount' => ['required', 'integer', 'min:0'],
                'data.summary' => ['required', 'string'],
                'data.paragraphs' => ['required', 'array', 'min:1'],
                'data.paragraphs.*' => ['required', 'string'],
                'data.vocabulary' => ['present', 'array'],
                'data.vocabulary.*.word' => ['required', 'string'],
                'data.vocabulary.*.meaning' => ['required', 'string'],
                'data.vocabulary.*.example' => ['required', 'string'],
                'data.questions' => ['present', 'array'],
                'data.questions.*.id' => ['required', 'string'],
                'data.questions.*.type' => ['required', 'in:single-choice,multiple-choice,true-false,sequencing,short-answer'],
                'data.questions.*.question' => ['required', 'string'],
                'data.questions.*.correctAnswers' => ['required'],
                'data.questions.*.explanation' => ['required', 'string'],
                'data.questions.*.cognitiveLevel' => ['required', 'string'],
                'data.questions.*.options' => ['nullable', 'array'],
                'data.questions.*.sequenceItems' => ['nullable', 'array'],
                'data.authorOrSource' => ['required', 'string'],
            ]);
        }

        return array_merge($rules, [
            'data.levelLabel' => ['required', 'string'],
            'data.domain' => ['required', 'string'],
            'data.domainLabel' => ['required', 'string'],
            'data.context' => ['required', 'string'],
            'data.contextLabel' => ['required', 'string'],
            'data.stimulus' => ['required', 'array'],
            'data.stimulus.text' => ['required', 'string'],
            'data.question' => ['required', 'string'],
            'data.type' => ['required', 'in:single-choice,multiple-choice,matching,numeric,true-false'],
            'data.correctAnswer' => ['required'],
            'data.hint' => ['required', 'string'],
            'data.stepByStepSolution' => ['required', 'array'],
            'data.cognitiveLevel' => ['required', 'string'],
        ]);
    }

    private function isValidPayload(array $payload, string $type): bool
    {
        if ($type === 'reading-practice') {
            return isset($payload['id'], $payload['kind'])
                && match ($payload['kind']) {
                    'syllable' => is_string($payload['word'] ?? null)
                        && is_array($payload['syllables'] ?? null)
                        && count($payload['syllables']) >= 2,
                    'word-image' => is_string($payload['word'] ?? null)
                        && is_string($payload['image'] ?? null)
                        && is_array($payload['options'] ?? null)
                        && count($payload['options']) === 4,
                    'sentence' => is_string($payload['sentence'] ?? null)
                        && is_string($payload['image'] ?? null),
                    default => false,
                };
        }

        if ($type === 'passages') {
            return isset(
                $payload['title'],
                $payload['levelLabel'],
                $payload['genreLabel'],
                $payload['summary'],
                $payload['authorOrSource'],
            )
                && is_array($payload['paragraphs'] ?? null)
                && is_array($payload['vocabulary'] ?? null)
                && is_array($payload['questions'] ?? null)
                && is_numeric($payload['estimatedReadTimeMinutes'] ?? null)
                && is_numeric($payload['wordCount'] ?? null);
        }

        return isset(
            $payload['title'],
            $payload['levelLabel'],
            $payload['domainLabel'],
            $payload['contextLabel'],
            $payload['question'],
            $payload['hint'],
            $payload['cognitiveLevel'],
        )
            && is_array($payload['stimulus'] ?? null)
            && is_string($payload['stimulus']['text'] ?? null)
            && is_array($payload['stepByStepSolution'] ?? null)
            && array_key_exists('correctAnswer', $payload);
    }

    private function contentKind(string $type): string
    {
        return match ($type) {
            'passages' => 'literacy',
            'questions' => 'numeracy',
            'reading-practice' => 'reading-practice',
        };
    }
}
