<?php

namespace App\Services;

use App\Repositories\BusinessRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BusinessService
{
    protected $repository;

    public function __construct(BusinessRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getBusinessesForDataTable(Request $request)
    {
        $query = $this->repository->getFilteredQuery($request);
        return $query->select('id', 'nama_perusahaan', 'nib', 'kecamatan', 'judul_kbli', 'status')->paginate(20);
    }

    public function getBusinessesForMap(Request $request)
    {
        $zoom = (int) $request->query('zoom', 15);
        
        $cacheKey = 'province-map:' . md5(json_encode([
            'zoom' => $zoom,
            'bounds' => $request->bounds,
            'kecamatan' => $request->kecamatan,
            'kelurahan' => $request->kelurahan,
            'kategori' => $request->kategori,
            'status' => $request->status,
            'risiko' => $request->risiko,
            'tahun' => $request->tahun,
            'search' => $request->search,
        ]));

        $ttl = config('map.cache_ttl', 30);

        return Cache::remember($cacheKey, $ttl, function() use ($request, $zoom) {
            $query = $this->repository->getFilteredQuery($request);
            $hasSearch = !empty($request->search);
            return $this->executeIndividualQuery($query, 'individual', $zoom, $hasSearch);
        });
    }

    private function executeIndividualQuery($query, $mode, $zoom, $hasSearch = false)
    {
        $limit = 0;

        if ($zoom < 8) {
            $limit = 0;
        } elseif ($zoom >= 8 && $zoom <= 9) {
            $limit = 20;
        } elseif ($zoom >= 10 && $zoom <= 11) {
            $limit = 50;
        } elseif ($zoom == 12) {
            $limit = 100;
        } elseif ($zoom >= 13 && $zoom <= 14) {
            $limit = 250;
        } elseif ($zoom >= 15 && $zoom <= 16) {
            $limit = 350;
        } else {
            $limit = null; // zoom 15+ -> unlimited in viewport
        }
        
        $clonedQuery = clone $query;
        
        // Return immediately if limit is 0
        if ($limit === 0) {
            return [
                'meta' => [
                    'zoom' => $zoom,
                    'mode' => $mode,
                    'count' => 0,
                    'limit' => $limit
                ],
                'data' => []
            ];
        }

        $clonedQuery->selectRaw("
                'individual' as type,
                id, lat, lng, color, nama_perusahaan, nib, judul_kbli, status, kecamatan, kelurahan, risiko, skala_usaha
            ")
            ->whereNotNull('lat')
            ->whereNotNull('lng');

        if ($limit !== null) {
            $clonedQuery->limit($limit);
        }

        $data = $clonedQuery->get();

        return [
            'meta' => [
                'zoom' => $zoom,
                'mode' => $mode,
                'count' => count($data),
                'limit' => $limit
            ],
            'data' => $data
        ];
    }

    public function search(Request $request)
    {
        $keyword = $request->query('q', '');
        
        if (strlen($keyword) < 2) {
            return [];
        }

        return $this->repository->searchByKeyword($keyword);
    }

    public function show(int $id)
    {
        return $this->repository->findById($id);
    }

    public function store(array $data)
    {
        $data['status'] = $data['status'] ?? 'Aktif';
        $data['tgl_terbit'] = $data['tgl_terbit'] ?? now()->toDateString();

        $business = $this->repository->create($data);

        $this->clearCaches();

        return $business;
    }

    public function update(int $id, array $data)
    {
        $business = $this->repository->update($id, $data);

        $this->clearCaches();

        return $business;
    }

    public function destroy(int $id)
    {
        $this->repository->delete($id);

        $this->clearCaches();
    }

    private function clearCaches()
    {
        Cache::forget('dashboard_data');
        Cache::forget('map_markers_all');
    }
}
