<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    public function index(Request $request)
    {
        $query = Business::query();

        if ($request->has('kecamatan') && $request->kecamatan !== 'Semua') {
            $query->where('kecamatan', $request->kecamatan);
        }

        if ($request->has('kelurahan') && $request->kelurahan !== 'Semua') {
            $query->where('kelurahan', $request->kelurahan);
        }

        if ($request->has('kategori') && $request->kategori !== 'Semua') {
            $query->where('judul_kbli', $request->kategori);
        }

        if ($request->has('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        if ($request->has('risiko') && $request->risiko !== 'Semua') {
            $query->where('risiko', $request->risiko);
        }

        if ($request->has('tahun') && $request->tahun !== 'Semua') {
            $query->whereYear('tgl_terbit', $request->tahun);
        }

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('nama_perusahaan', 'like', '%' . $request->search . '%')
                  ->orWhere('nib', 'like', '%' . $request->search . '%')
                  ->orWhere('id_proyek', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('bounds') && !empty($request->bounds)) {
            $bounds = explode(',', $request->bounds);
            if (count($bounds) === 4) {
                $swLat = min($bounds[0], $bounds[2]);
                $neLat = max($bounds[0], $bounds[2]);
                $swLng = min($bounds[1], $bounds[3]);
                $neLng = max($bounds[1], $bounds[3]);

                $query->whereBetween('lat', [$swLat, $neLat])
                      ->whereBetween('lng', [$swLng, $neLng]);
            }
        }

        if ($request->boolean('map')) {
            // Check if there are any filters applied (search, kecamatan, kategori, dll).
            $hasFilters = $request->has('kecamatan') && $request->kecamatan !== 'Semua' ||
                          $request->has('kelurahan') && $request->kelurahan !== 'Semua' ||
                          $request->has('kategori') && $request->kategori !== 'Semua' ||
                          $request->has('status') && $request->status !== 'Semua' ||
                          $request->has('risiko') && $request->risiko !== 'Semua' ||
                          $request->has('tahun') && $request->tahun !== 'Semua' ||
                          $request->has('search') && !empty($request->search) ||
                          $request->has('bounds');

            if (!$hasFilters) {
                // If no filters, cache the entire map payload to save rendering time
                $markers = \Illuminate\Support\Facades\Cache::remember('map_markers_all', 3600, function() use ($query) {
                    return $query->select('id', 'lat', 'lng', 'color', 'nama_perusahaan', 'nib', 'judul_kbli', 'status', 'kecamatan', 'kelurahan', 'risiko')
                        ->whereNotNull('lat')
                        ->whereNotNull('lng')
                        ->limit(1500)
                        ->get();
                });
                return response()->json($markers);
            }

            // For filtered map, only fetch necessary columns and exclude entries without coordinates
            $markers = $query->select('id', 'lat', 'lng', 'color', 'nama_perusahaan', 'nib', 'judul_kbli', 'status', 'kecamatan', 'kelurahan', 'risiko')
                ->whereNotNull('lat')
                ->whereNotNull('lng')
                ->limit(1500)
                ->get();
            return response()->json($markers);
        }

        // Limit payload for the frontend data table by selecting only necessary columns
        return response()->json($query->select('id', 'nama_perusahaan', 'nib', 'kecamatan', 'judul_kbli', 'status')->paginate(20));
    }

    public function show($id)
    {
        $business = Business::findOrFail($id);
        return response()->json($business);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_proyek' => 'nullable|string',
            'nib' => 'required|string',
            'nama_perusahaan' => 'required|string',
            'risiko' => 'nullable|string',
            'kbli' => 'nullable|string',
            'judul_kbli' => 'nullable|string',
            'alamat_proyek' => 'nullable|string',
            'kecamatan' => 'nullable|string',
            'kelurahan' => 'nullable|string',
            'status_pm' => 'nullable|string',
            'status' => 'nullable|string',
            'tgl_terbit' => 'nullable|date',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'color' => 'nullable|string',
        ]);

        $validated['status'] = $validated['status'] ?? 'Aktif';
        $validated['tgl_terbit'] = $validated['tgl_terbit'] ?? now()->toDateString();

        $business = Business::create($validated);

        \Illuminate\Support\Facades\Cache::forget('dashboard_data');
        \Illuminate\Support\Facades\Cache::forget('map_markers_all');

        return response()->json(['message' => 'Usaha berhasil ditambahkan', 'data' => $business], 201);
    }

    public function update(Request $request, $id)
    {
        $business = Business::findOrFail($id);

        $validated = $request->validate([
            'id_proyek' => 'nullable|string',
            'nib' => 'nullable|string',
            'nama_perusahaan' => 'nullable|string',
            'risiko' => 'nullable|string',
            'kbli' => 'nullable|string',
            'judul_kbli' => 'nullable|string',
            'alamat_proyek' => 'nullable|string',
            'kecamatan' => 'nullable|string',
            'kelurahan' => 'nullable|string',
            'status_pm' => 'nullable|string',
            'status' => 'nullable|string',
            'tgl_terbit' => 'nullable|date',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'color' => 'nullable|string',
        ]);

        $business->update($validated);

        \Illuminate\Support\Facades\Cache::forget('dashboard_data');
        \Illuminate\Support\Facades\Cache::forget('map_markers_all');

        return response()->json(['message' => 'Data usaha berhasil diperbarui', 'data' => $business]);
    }

    public function destroy($id)
    {
        $business = Business::findOrFail($id);
        $business->delete();

        \Illuminate\Support\Facades\Cache::forget('dashboard_data');
        \Illuminate\Support\Facades\Cache::forget('map_markers_all');

        return response()->json(['message' => 'Data usaha berhasil dihapus']);
    }
}
