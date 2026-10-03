<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FcmDevice extends Model
{
    protected $fillable = [
        'user_id',
        'username',
        'device_id',
        'token',
        'platform',
    ];

    protected $hidden = [
        'token',
    ];

    protected function casts(): array
    {
        return [
            'token' => 'encrypted',
        ];
    }
}
