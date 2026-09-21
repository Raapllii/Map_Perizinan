<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicMapFeedback extends Model
{
    use HasFactory;

    protected $table = 'public_map_feedbacks';

    protected $guarded = [];

    public function publicMapAccessLog()
    {
        return $this->belongsTo(PublicMapAccessLog::class, 'public_map_access_log_id');
    }

    public function accessLog()
    {
        return $this->publicMapAccessLog();
    }

    public function business()
    {
        return $this->belongsTo(Business::class, 'business_id');
    }
}
