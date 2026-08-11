<?php

namespace App\Repositories;

use App\Models\Business;
use Illuminate\Http\Request;

class BusinessRepository
{
    public function getFilteredQuery(Request $request)
    {
        $query = Business::query();

        $filters = ['kecamatan', 'kelurahan', 'risiko', 'status'];
        foreach ($filters as $filter) {
            if ($request->has($filter) && $request->get($filter) !== 'Semua') {
                $query->where($filter, $request->get($filter));
            }
        }

        if ($request->has('kategori') && $request->get('kategori') !== 'Semua') {
            $query->where('judul_kbli', $request->get('kategori'));
        }

        if ($request->has('tahun') && $request->get('tahun') !== 'Semua') {
            $query->whereYear('tgl_terbit', $request->get('tahun'));
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

        return $query;
    }

    public function searchByKeyword(string $keyword)
    {
        $query = Business::select('id', 'nama_perusahaan', 'judul_kbli', 'nib', 'kecamatan', 'kelurahan', 'status', 'risiko', 'lat', 'lng')
            ->whereNotNull('lat')
            ->whereNotNull('lng');

        $words = explode(' ', $keyword);
        foreach ($words as $word) {
            if (!empty($word)) {
                $query->where(function($q) use ($word) {
                    $q->where('nama_perusahaan', 'LIKE', "%{$word}%")
                      ->orWhere('judul_kbli', 'LIKE', "%{$word}%")
                      ->orWhere('kbli', 'LIKE', "%{$word}%")
                      ->orWhere('nib', 'LIKE', "%{$word}%")
                      ->orWhere('id_proyek', 'LIKE', "%{$word}%")
                      ->orWhere('kecamatan', 'LIKE', "%{$word}%")
                      ->orWhere('kelurahan', 'LIKE', "%{$word}%")
                      ->orWhere('alamat_proyek', 'LIKE', "%{$word}%");
                });
            }
        }
        
        $query->orderByRaw("
            CASE 
                WHEN nama_perusahaan LIKE ? THEN 1
                WHEN nama_perusahaan LIKE ? THEN 2
                ELSE 3
            END
        ", [$keyword, "{$keyword}%"]);

        return $query->limit(10)->get();
    }

    public function findById(int $id)
    {
        return Business::findOrFail($id);
    }

    public function create(array $data)
    {
        return Business::create($data);
    }

    public function update(int $id, array $data)
    {
        $business = $this->findById($id);
        $business->update($data);
        return $business;
    }

    public function delete(int $id)
    {
        $business = $this->findById($id);
        return $business->delete();
    }
}
