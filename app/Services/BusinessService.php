<?php

namespace App\Services;

use App\Repositories\BusinessRepository;
use App\Models\BusinessIndicator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

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
        return $query->with('indicators')->select(
            'id', 'nama_perusahaan', 'nib', 'kecamatan_usaha', 'kelurahan_usaha', 'judul_kbli', 'status', 'latitude', 'longitude', 'color',
            'indicator_1', 'indicator_2', 'indicator_3', 'indicator_4', 'indicator_5',
            'indicator_6', 'indicator_7', 'indicator_8', 'indicator_9', 'indicator_10'
        )->paginate($perPage);
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

        $clonedQuery->with('indicators')
            ->selectRaw("
                'individual' as type,
                id, latitude, longitude, color, nama_perusahaan, nama_proyek, nib, kbli, judul_kbli, status,
                alamat_usaha, kecamatan_usaha, kelurahan_usaha, kab_kota_usaha,
                uraian_jenis_perusahaan, uraian_risiko_proyek, uraian_skala_usaha, uraian_status_penanaman_modal,
                indicator_1, indicator_2, indicator_3, indicator_4, indicator_5, indicator_6, indicator_7, indicator_8, indicator_9, indicator_10
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
        return DB::transaction(function () use ($data) {
            $data['status'] = $data['status'] ?? 'Aktif';
            $data['tanggal_terbit_oss'] = $data['tanggal_terbit_oss'] ?? now()->toDateString();

            $indicatorsData = $data['indicators'] ?? [];
            unset($data['indicators']);

            $business = $this->repository->create($data);

            if (!empty($indicatorsData) && is_array($indicatorsData)) {
                $sort = 1;
                foreach ($indicatorsData as $item) {
                    $judul = trim($item['judul'] ?? '');
                    if (empty($judul)) continue;

                    $nilai = isset($item['nilai']) ? (string)$item['nilai'] : null;
                    $sortOrder = isset($item['sort_order']) ? (int)$item['sort_order'] : $sort;

                    BusinessIndicator::create([
                        'business_id' => $business->id,
                        'judul' => $judul,
                        'nilai' => $nilai,
                        'sort_order' => $sortOrder,
                    ]);
                    $sort++;
                }
            }

            $this->clearCaches();

            return $business->load('indicators');
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $indicatorsProvided = array_key_exists('indicators', $data);
            $indicatorsData = $data['indicators'] ?? [];
            unset($data['indicators']);

            $business = $this->repository->update($id, $data);

            if ($indicatorsProvided && is_array($indicatorsData)) {
                $incomingIds = [];
                $sort = 1;

                foreach ($indicatorsData as $item) {
                    $judul = trim($item['judul'] ?? '');
                    if (empty($judul)) continue;

                    $nilai = isset($item['nilai']) ? (string)$item['nilai'] : null;
                    $sortOrder = isset($item['sort_order']) ? (int)$item['sort_order'] : $sort;

                    if (!empty($item['id'])) {
                        // Strictly verify ownership: must belong to this business
                        $existing = BusinessIndicator::where('id', $item['id'])
                            ->where('business_id', $business->id)
                            ->first();

                        if ($existing) {
                            $existing->update([
                                'judul' => $judul,
                                'nilai' => $nilai,
                                'sort_order' => $sortOrder,
                            ]);
                            $incomingIds[] = $existing->id;
                        } else {
                            // If ID is not owned by this business, do not tamper! Create as new for this business instead.
                            $newIndicator = BusinessIndicator::create([
                                'business_id' => $business->id,
                                'judul' => $judul,
                                'nilai' => $nilai,
                                'sort_order' => $sortOrder,
                            ]);
                            $incomingIds[] = $newIndicator->id;
                        }
                    } else {
                        $newIndicator = BusinessIndicator::create([
                            'business_id' => $business->id,
                            'judul' => $judul,
                            'nilai' => $nilai,
                            'sort_order' => $sortOrder,
                        ]);
                        $incomingIds[] = $newIndicator->id;
                    }

                    $sort++;
                }

                // Delete any indicators belonging to this business that were removed
                BusinessIndicator::where('business_id', $business->id)
                    ->whereNotIn('id', $incomingIds)
                    ->delete();
            }

            $this->clearCaches();

            return $business->load('indicators');
        });
    }

    public function destroy(int $id)
    {
        $this->repository->delete($id);

        $this->clearCaches();
    }

    public function bulkDestroy(array $ids, $user = null)
    {
        $count = \App\Models\Business::whereIn('id', $ids)->delete();

        if ($user && $count > 0) {
            try {
                \App\Models\ActivityLog::create([
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'action' => 'Hapus Massal',
                    'description' => "Menghapus {$count} data usaha secara massal",
                ]);
            } catch (\Exception $e) {
                // Ignore activity log failure
            }
        }

        $this->clearCaches();

        return $count;
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

    public function generatePdf($business)
    {
        // 1. Process indicators strictly preserving sort_order
        $indicators = [];
        if ($business->relationLoaded('indicators') || $business->indicators) {
            foreach ($business->indicators as $ind) {
                if (!empty(trim($ind->judul ?? '')) && $ind->nilai !== null && trim((string)$ind->nilai) !== '') {
                    $indicators[] = [
                        'judul' => trim($ind->judul),
                        'nilai' => trim((string)$ind->nilai),
                        'sort_order' => $ind->sort_order,
                    ];
                }
            }
        }

        // If relational indicators are empty, fallback to legacy indicators 1..10
        if (empty($indicators)) {
            for ($i = 1; $i <= 10; $i++) {
                $val = $business->{'indicator_' . $i} ?? null;
                if ($val !== null && trim((string)$val) !== '') {
                    $indicators[] = [
                        'judul' => 'Indikator ' . $i,
                        'nilai' => trim((string)$val),
                        'sort_order' => $i,
                    ];
                }
            }
        }

        // 2. Risk configuration matching Public Map
        $riskConfig = $this->getRiskConfig($business->uraian_risiko_proyek);

        // 3. Coordinate validation
        $hasCoordinates = false;
        $formattedCoords = null;
        if (
            $business->latitude !== null && 
            $business->longitude !== null &&
            is_numeric($business->latitude) && 
            is_numeric($business->longitude) &&
            !(floatval($business->latitude) == 0 && floatval($business->longitude) == 0) &&
            floatval($business->latitude) >= -90 && floatval($business->latitude) <= 90 &&
            floatval($business->longitude) >= -180 && floatval($business->longitude) <= 180
        ) {
            $hasCoordinates = true;
            $formattedCoords = [
                'latitude' => number_format((float)$business->latitude, 6, '.', ''),
                'longitude' => number_format((float)$business->longitude, 6, '.', '')
            ];
        }

        $data = [
            'business' => $business,
            'indicators' => $indicators,
            'riskConfig' => $riskConfig,
            'hasCoordinates' => $hasCoordinates,
            'formattedCoords' => $formattedCoords,
            'generatedAt' => now()->locale('id')->translatedFormat('d F Y, H:i') . ' WITA',
        ];

        $pdf = Pdf::loadView('pdf.business-detail', $data);
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'sans-serif',
        ]);

        $rawName = $business->nama_perusahaan ?: 'usaha-' . $business->id;
        $slug = Str::slug($rawName);
        if (empty($slug)) {
            $slug = 'usaha-' . $business->id;
        }

        $filename = 'detail-usaha-' . $slug . '.pdf';

        return $pdf->download($filename);
    }

    public function getRiskConfig(?string $rawRisk): array
    {
        if (!$rawRisk || !is_string($rawRisk)) {
            return [
                'category' => 'Tidak Ada Data',
                'color' => '#64748b',
                'bg' => '#f1f5f9',
                'border' => '#cbd5e1',
            ];
        }

        $clean = strtolower(preg_replace('/\s+/', ' ', trim($rawRisk)));

        if ($clean === 'rendah' || $clean === 'sangat rendah') {
            return [
                'category' => 'Rendah',
                'color' => '#16a34a',
                'bg' => '#dcfce7',
                'border' => '#86efac',
            ];
        }

        if ($clean === 'menengah rendah') {
            return [
                'category' => 'Menengah Rendah',
                'color' => '#ca8a04',
                'bg' => '#fef9c3',
                'border' => '#fde047',
            ];
        }

        if ($clean === 'menengah tinggi' || $clean === 'menengah') {
            return [
                'category' => 'Menengah Tinggi',
                'color' => '#ea580c',
                'bg' => '#ffedd5',
                'border' => '#fdba74',
            ];
        }

        if ($clean === 'tinggi' || $clean === 'sangat tinggi') {
            return [
                'category' => 'Tinggi',
                'color' => '#dc2626',
                'bg' => '#fee2e2',
                'border' => '#fca5a5',
            ];
        }

        return [
            'category' => 'Tidak Ada Data',
            'color' => '#64748b',
            'bg' => '#f1f5f9',
            'border' => '#cbd5e1',
        ];
    }
}

