<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicMapServiceSurveyResponse extends Model
{
    use HasFactory;

    protected $table = 'public_map_service_survey_responses';

    protected $guarded = [];

    protected $casts = [
        'score' => 'integer',
    ];

    public function survey()
    {
        return $this->belongsTo(PublicMapServiceSurvey::class, 'survey_id');
    }

    public function accessLog()
    {
        return $this->belongsTo(PublicMapAccessLog::class, 'public_map_access_log_id');
    }

    public function business()
    {
        return $this->belongsTo(Business::class, 'business_id');
    }
}
