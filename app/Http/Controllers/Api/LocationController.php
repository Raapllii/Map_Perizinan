<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function getKecamatan()
    {
        $kecamatan = Business::select('kecamatan')
            ->distinct()
            ->whereNotNull('kecamatan')
            ->where('kecamatan', '!=', '')
            ->orderBy('kecamatan', 'asc')
            ->pluck('kecamatan');
            
        return response()->json($kecamatan);
    }

    public function getKelurahan(Request $request)
    {
        $query = Business::select('kelurahan')
            ->distinct()
            ->whereNotNull('kelurahan')
            ->where('kelurahan', '!=', '');
            
        if ($request->has('kecamatan') && $request->kecamatan !== '' && $request->kecamatan !== 'Semua') {
            $query->where('kecamatan', $request->kecamatan);
        }
        
        $kelurahan = $query->orderBy('kelurahan', 'asc')->pluck('kelurahan');
            
        return response()->json($kelurahan);
    }
}
