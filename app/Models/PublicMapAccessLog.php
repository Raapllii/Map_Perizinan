<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicMapAccessLog extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'accessed_at' => 'datetime',
    ];

    public function feedback()
    {
        return $this->hasOne(PublicMapFeedback::class, 'public_map_access_log_id');
    }
}
