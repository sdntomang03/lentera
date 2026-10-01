<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function index(string $type): JsonResponse
    {
        $kind = $type === 'passages' ? 'literacy' : 'numeracy';
        $items = ContentItem::where('type', $kind)->orderBy('id')->get()
            ->filter(fn (ContentItem $item) => $this->isValidPayload($item->payload, $type))
            ->values()
            ->map(fn (ContentItem $item) => array_merge($item->payload, ['id' => $item->id]));

        return response()->json(['data' => $items]);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $payload = $request->validate($this->contentRules($type))['data'];
        $id = $payload['id'];
        $item = ContentItem::create([
            'id' => $id,
            'type' => $type === 'passages' ? 'literacy' : 'numeracy',
            'payload' => $payload,
        ]);

        return response()->json(['data' => array_merge($item->payload, ['id' => $item->id])], 201);
    }

    public function update(Request $request, string $type, string $id): JsonResponse
    {
        $payload = $request->validate($this->contentRules($type))['data'];
        abort_if($payload['id'] !== $id, 422, 'ID konten pada path dan data harus sama.');
        $item = ContentItem::where('type', $type === 'passages' ? 'literacy' : 'numeracy')
            ->findOrFail($id);
        $item->update(['payload' => array_merge($payload, ['id' => $id])]);

        return response()->json(['data' => array_merge($item->payload, ['id' => $id])]);
    }

    public function destroy(string $type, string $id): JsonResponse
    {
        ContentItem::where('type', $type === 'passages' ? 'literacy' : 'numeracy')
            ->findOrFail($id)->delete();

        return response()->json(['message' => 'Konten berhasil dihapus.']);
    }

    private function contentRules(string $type): array
    {
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
}
