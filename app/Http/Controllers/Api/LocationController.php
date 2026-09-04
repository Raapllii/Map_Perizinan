<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function getKecamatan()
    {
        $kecamatan_usaha = Business::select('kecamatan_usaha')
            ->distinct()
            ->whereNotNull('kecamatan_usaha')
            ->where('kecamatan_usaha', '!=', '')
            ->orderBy('kecamatan_usaha', 'asc')
            ->pluck('kecamatan_usaha');
            
        return response()->json($kecamatan_usaha);
    }

    public function getKelurahan(Request $request)
    {
        $query = Business::select('kelurahan_usaha')
            ->distinct()
            ->whereNotNull('kelurahan_usaha')
            ->where('kelurahan_usaha', '!=', '');
            
        if ($request->has('kecamatan_usaha') && $request->kecamatan_usaha !== '' && $request->kecamatan_usaha !== 'Semua') {
            $query->where('kecamatan_usaha', $request->kecamatan_usaha);
        }
        
        $kelurahan = $query->orderBy('kelurahan_usaha', 'asc')->pluck('kelurahan_usaha');
            
        return response()->json($kelurahan);
    }
}
