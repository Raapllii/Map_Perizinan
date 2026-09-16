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
            'kecamatan_usaha' => 'kecamatan_usaha',
            'kelurahan_usaha' => 'kelurahan_usaha',
            'uraian_risiko_proyek' => 'uraian_risiko_proyek',
            'status' => 'status',
            'judul_kbli' => 'judul_kbli'
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
            $query->whereYear('tanggal_terbit_oss', $request->get('tahun'));
        }

        if ($request->has('status_pemetaan') && $request->get('status_pemetaan') !== 'Semua') {
            $statusPemetaan = $request->get('status_pemetaan');
            
            $validLat = "(latitude::text ~ '^-?[0-9]+(\.[0-9]+)?$' AND (CASE WHEN latitude::text ~ '^-?[0-9]+(\.[0-9]+)?$' THEN latitude::numeric ELSE 999 END) BETWEEN -90 AND 90)";
            $validLng = "(longitude::text ~ '^-?[0-9]+(\.[0-9]+)?$' AND (CASE WHEN longitude::text ~ '^-?[0-9]+(\.[0-9]+)?$' THEN longitude::numeric ELSE 999 END) BETWEEN -180 AND 180)";

            if ($statusPemetaan === 'Sudah Dipetakan') {
                $query->whereNotNull('latitude')->whereNotNull('longitude')
                      ->whereRaw($validLat)
                      ->whereRaw($validLng);
            } else if ($statusPemetaan === 'Belum Dipetakan') {
                $query->where(function($q) use ($validLat, $validLng) {
                    $q->whereNull('latitude')
                      ->orWhereNull('longitude')
                      ->orWhereRaw("NOT {$validLat}")
                      ->orWhereRaw("NOT {$validLng}");
                });
            }
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereRaw("to_tsvector('simple', COALESCE(nama_perusahaan, '') || ' ' || COALESCE(judul_kbli, '') || ' ' || COALESCE(kbli, '') || ' ' || COALESCE(nib, '') || ' ' || COALESCE(id_proyek, '') || ' ' || COALESCE(kecamatan_usaha, '') || ' ' || COALESCE(kelurahan_usaha, '') || ' ' || COALESCE(alamat_usaha, '')) @@ plainto_tsquery('simple', ?)", [$search])
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
        $query = Business::query()->with('indicators')->select(
            'id', 'nama_perusahaan', 'nama_proyek', 'nib', 'kbli', 'judul_kbli', 'alamat_usaha', 
            'kecamatan_usaha', 'kelurahan_usaha', 'kab_kota_usaha',
            'uraian_jenis_perusahaan', 'uraian_status_penanaman_modal', 'uraian_skala_usaha',
            'status', 'uraian_risiko_proyek', 
            'latitude', 'longitude',
            'indicator_1', 'indicator_2', 'indicator_3', 'indicator_4', 'indicator_5',
            'indicator_6', 'indicator_7', 'indicator_8', 'indicator_9', 'indicator_10'
        );

        if (!empty($keyword)) {
            $query->where(function($q) use ($keyword) {
                $q->whereRaw("to_tsvector('simple', COALESCE(nama_perusahaan, '') || ' ' || COALESCE(judul_kbli, '') || ' ' || COALESCE(kbli, '') || ' ' || COALESCE(nib, '') || ' ' || COALESCE(id_proyek, '') || ' ' || COALESCE(kecamatan_usaha, '') || ' ' || COALESCE(kelurahan_usaha, '') || ' ' || COALESCE(alamat_usaha, '')) @@ plainto_tsquery('simple', ?)", [$keyword])
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
        return Business::with('indicators')->findOrFail($id);
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
