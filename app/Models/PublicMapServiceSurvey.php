<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicMapServiceSurvey extends Model
{
    use HasFactory;

    protected $table = 'public_map_service_surveys';

    protected $guarded = [];

    protected $casts = [
        'total_score' => 'integer',
        'average_score' => 'float',
    ];

    public function accessLog()
    {
        return $this->belongsTo(PublicMapAccessLog::class, 'public_map_access_log_id');
    }

    public function business()
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function responses()
    {
        return $this->hasMany(PublicMapServiceSurveyResponse::class, 'survey_id');
    }
}
