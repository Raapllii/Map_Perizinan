<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessIndicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'judul',
        'nilai',
        'sort_order',
    ];

    protected $casts = [
        'business_id' => 'integer',
        'sort_order' => 'integer',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
