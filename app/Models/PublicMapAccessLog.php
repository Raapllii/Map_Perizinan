<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicMapAccessLog extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $hidden = [
        'nik',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'accessed_at' => 'datetime',
    ];

    public function feedback()
    {
        return $this->hasOne(PublicMapFeedback::class, 'public_map_access_log_id');
    }

    public function surveys()
    {
        return $this->hasMany(PublicMapServiceSurvey::class, 'public_map_access_log_id');
    }
}
