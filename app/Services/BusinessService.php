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
        $perPage = min((int) $request->get('per_page', 20), 100);
        return $query->select('id', 'nama_perusahaan', 'nib', 'kecamatan_usaha', 'kelurahan_usaha', 'judul_kbli', 'status', 'latitude', 'longitude', 'color')->paginate($perPage);
    }

    public function getBusinessesForMap(Request $request)
    {
        $zoom = (int) $request->query('zoom', 15);
        
        $cacheKey = 'province-map:' . md5(json_encode([
            'zoom' => $zoom,
            'bounds' => $request->bounds,
            'kecamatan_usaha' => $request->kecamatan_usaha,
            'kelurahan_usaha' => $request->kelurahan_usaha,
            'judul_kbli' => $request->judul_kbli,
            'status' => $request->status,
            'uraian_risiko_proyek' => $request->uraian_risiko_proyek,
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
                id, latitude, longitude, color, nama_perusahaan, nib, judul_kbli, status, kecamatan_usaha, kelurahan_usaha, uraian_risiko_proyek, uraian_skala_usaha
            ")
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

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
        $data['tanggal_terbit_oss'] = $data['tanggal_terbit_oss'] ?? now()->toDateString();

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

    public function updateStatus(int $id, string $status, ?string $note, $user = null)
    {
        $business = $this->repository->findById($id);
        $oldStatus = $business->status;
        
        $business = $this->repository->update($id, ['status' => $status]);

        // Record activity log
        \App\Models\ActivityLog::create([
            'user_id' => $user ? $user->id : null,
            'user_name' => $user ? $user->name : 'System',
            'action' => 'Verifikasi',
            'business_id' => $id,
            'business_name' => $business->nama_perusahaan,
            'old_status' => $oldStatus,
            'new_status' => $status,
            'note' => $note
        ]);

        $this->clearCaches();

        return $business;
    }
}
