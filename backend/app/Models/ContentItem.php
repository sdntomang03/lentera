<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['id', 'type', 'school_id', 'payload'])]
class ContentItem extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
