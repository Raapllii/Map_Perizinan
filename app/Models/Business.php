<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'tanggal_terbit_oss' => 'date',
        'luas_tanah' => 'float',
        'jumlah_investasi' => 'float',
        'tki' => 'integer'
    ];
}
