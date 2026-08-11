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
        $query = $this->repository->getFilteredQuery($request);
        
        $hasFilters = $request->has('kecamatan') && $request->kecamatan !== 'Semua' ||
                      $request->has('kelurahan') && $request->kelurahan !== 'Semua' ||
                      $request->has('kategori') && $request->kategori !== 'Semua' ||
                      $request->has('status') && $request->status !== 'Semua' ||
                      $request->has('risiko') && $request->risiko !== 'Semua' ||
                      $request->has('tahun') && $request->tahun !== 'Semua' ||
                      $request->has('search') && !empty($request->search) ||
                      $request->has('bounds');

        if (!$hasFilters) {
            return Cache::remember('map_markers_all', 3600, function() use ($query) {
                return $this->executeMapQuery($query);
            });
        }

        return $this->executeMapQuery($query);
    }

    private function executeMapQuery($query)
    {
        return $query->select('id', 'lat', 'lng', 'color', 'nama_perusahaan', 'nib', 'judul_kbli', 'status', 'kecamatan', 'kelurahan', 'risiko')
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->limit(1500)
            ->get();
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
