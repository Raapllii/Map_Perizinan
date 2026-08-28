<?php

namespace App\Repositories;

use App\Models\Business;
use Illuminate\Http\Request;

class BusinessRepository
{
    public function getFilteredQuery(Request $request)
    {
        $query = Business::query();

        $filters = [
            'kecamatan' => 'kecamatan',
            'kelurahan' => 'kelurahan',
            'risiko' => 'risiko',
            'status' => 'status',
            'kategori' => 'judul_kbli'
        ];

        foreach ($filters as $requestKey => $dbColumn) {
            if ($request->has($requestKey) && $request->get($requestKey) !== 'Semua') {
                $val = $request->get($requestKey);
                $operator = $request->get($requestKey . '_operator', 'adalah');
                
                $values = is_array($val) ? $val : explode(',', $val);
                $values = array_map('trim', $values);

                if ($operator === 'bukan') {
                    $query->whereNotIn($dbColumn, $values);
                } else {
                    // untuk 'adalah' atau 'salah satu dari'
                    if (count($values) > 1) {
                        $query->whereIn($dbColumn, $values);
                    } else {
                        $query->where($dbColumn, $values[0]);
                    }
                }
            }
        }

        if ($request->has('tahun') && $request->get('tahun') !== 'Semua') {
            $query->whereYear('tgl_terbit', $request->get('tahun'));
        }

        if ($request->has('status_pemetaan') && $request->get('status_pemetaan') !== 'Semua') {
            $statusPemetaan = $request->get('status_pemetaan');
            if ($statusPemetaan === 'Sudah Dipetakan') {
                $query->whereNotNull('lat')->where('lat', '!=', '')
                      ->whereNotNull('lng')->where('lng', '!=', '');
            } else if ($statusPemetaan === 'Belum Dipetakan') {
                $query->where(function($q) {
                    $q->whereNull('lat')
                      ->orWhere('lat', '')
                      ->orWhereNull('lng')
                      ->orWhere('lng', '');
                });
            }
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereRaw("to_tsvector('simple', COALESCE(nama_perusahaan, '') || ' ' || COALESCE(judul_kbli, '') || ' ' || COALESCE(kbli, '') || ' ' || COALESCE(nib, '') || ' ' || COALESCE(id_proyek, '') || ' ' || COALESCE(kecamatan, '') || ' ' || COALESCE(kelurahan, '') || ' ' || COALESCE(alamat_proyek, '')) @@ plainto_tsquery('simple', ?)", [$search])
                  ->orWhere('nama_perusahaan', 'ILIKE', '%' . $search . '%')
                  ->orWhere('nib', 'ILIKE', '%' . $search . '%')
                  ->orWhere('id_proyek', 'ILIKE', '%' . $search . '%');
            });
        }

        if ($request->has('bounds') && !empty($request->bounds)) {
            $bounds = explode(',', $request->bounds);
            if (count($bounds) === 4) {
                // PostGIS expects ST_MakeEnvelope(xmin, ymin, xmax, ymax, SRID)
                // x = longitude, y = latitude
                $swLat = min((float)$bounds[0], (float)$bounds[2]);
                $neLat = max((float)$bounds[0], (float)$bounds[2]);
                $swLng = min((float)$bounds[1], (float)$bounds[3]);
                $neLng = max((float)$bounds[1], (float)$bounds[3]);

                $query->whereRaw(
                    'location && ST_MakeEnvelope(?, ?, ?, ?, 4326)',
                    [$swLng, $swLat, $neLng, $neLat]
                );
            }
        }

        // Sorting logic (Whitelist)
        $allowedSorts = ['nama_perusahaan', 'created_at', 'status'];
        $sortBy = $request->get('sort_by');
        $sortDirection = strtolower($request->get('sort_direction')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sortBy, $allowedSorts)) {
            // Handle null values in sorting especially for nama_perusahaan
            if ($sortDirection === 'asc') {
                $query->orderByRaw("{$sortBy} IS NULL ASC, {$sortBy} ASC");
            } else {
                $query->orderByRaw("{$sortBy} IS NULL ASC, {$sortBy} DESC");
            }
        } else {
            // Default sorting
            $query->orderBy('created_at', 'desc');
        }

        return $query;
    }



    public function searchByKeyword(string $keyword)
    {
        $query = Business::select('id', 'nama_perusahaan', 'judul_kbli', 'nib', 'kecamatan', 'kelurahan', 'status', 'risiko', 'lat', 'lng');

        if (!empty($keyword)) {
            $query->where(function($q) use ($keyword) {
                $q->whereRaw("to_tsvector('simple', COALESCE(nama_perusahaan, '') || ' ' || COALESCE(judul_kbli, '') || ' ' || COALESCE(kbli, '') || ' ' || COALESCE(nib, '') || ' ' || COALESCE(id_proyek, '') || ' ' || COALESCE(kecamatan, '') || ' ' || COALESCE(kelurahan, '') || ' ' || COALESCE(alamat_proyek, '')) @@ plainto_tsquery('simple', ?)", [$keyword])
                  ->orWhere('nama_perusahaan', 'ILIKE', "%{$keyword}%")
                  ->orWhere('nib', 'ILIKE', "%{$keyword}%");
            });
        }

        $query->orderByRaw("
            CASE 
                WHEN nama_perusahaan ILIKE ? THEN 1
                WHEN nama_perusahaan ILIKE ? THEN 2
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
