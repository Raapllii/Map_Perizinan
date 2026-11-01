<?php

namespace App\Exports;

use App\Exports\Sheets\DetailDataPerizinanSheet;
use App\Exports\Sheets\RekapitulasiGenderSheet;
use App\Exports\Sheets\RingkasanRekapitulasiSheet;
use App\Support\GenderNormalizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class RekapitulasiPerizinanExport implements WithMultipleSheets
{
    protected Builder $query;
    protected array $filterMeta;

    public function __construct(Builder $query, array $filterMeta = [])
    {
        $this->query = $query;
        $this->filterMeta = $filterMeta;
    }

    public function sheets(): array
    {
        $baseQuery = (clone $this->query)->setEagerLoads([])->reorder();

        // 1. Gender Recapitulation
        $genderRecap = GenderNormalizer::aggregateForBusinessQuery(clone $baseQuery);
        $totalAll = (int) ($genderRecap['total'] ?? 0);

        // 2. Build deduplicated [business_id => canonical_gender] map for Detail Data sheet
        $genderMap = $this->buildGenderMapForQuery(clone $baseQuery);

        // 3. Risk Recapitulation on the same filtered query
        $risksRaw = (clone $baseQuery)
            ->select('uraian_risiko_proyek', DB::raw('COUNT(*) as total'))
            ->groupBy('uraian_risiko_proyek')
            ->get();

        $riskMap = [
            'rendah' => 'Risiko Rendah',
            'menengah rendah' => 'Menengah Rendah',
            'menengah tinggi' => 'Menengah Tinggi',
            'tinggi' => 'Risiko Tinggi',
        ];

        $aggregatedRisks = [
            'Risiko Rendah' => 0,
            'Menengah Rendah' => 0,
            'Menengah Tinggi' => 0,
            'Risiko Tinggi' => 0,
            'Tidak Diisi' => 0,
        ];

        foreach ($risksRaw as $r) {
            $name = strtolower(trim($r->uraian_risiko_proyek ?? ''));
            $mapped = $riskMap[$name] ?? 'Tidak Diisi';
            $aggregatedRisks[$mapped] += (int) $r->total;
        }

        $finalRisks = [];
        foreach ($aggregatedRisks as $name => $val) {
            if ($name === 'Tidak Diisi' && $val === 0) {
                continue;
            }
            $finalRisks[] = [
                'name' => $name,
                'value' => $val,
            ];
        }

        // 4. Coordinate Mapping Recapitulation on the same filtered query
        $belumDipetakan = (clone $baseQuery)
            ->where(function ($q) {
                $q->whereNull('latitude')
                    ->orWhereNull('longitude')
                    ->orWhere('latitude', 0)
                    ->orWhere('longitude', 0);
            })
            ->count();

        $sudahDipetakan = max(0, $totalAll - $belumDipetakan);

        $summary = [
            'exported_at' => now()->locale('id')->translatedFormat('d F Y, H:i') . ' WITA',
            'filter_year_label' => $this->filterMeta['year_label'] ?? 'Semua Tahun',
            'filter_location_label' => $this->filterMeta['location_label'] ?? 'Semua Wilayah',
            'filter_status_label' => $this->filterMeta['status_label'] ?? 'Semua Status & Risiko',
            'filter_search_label' => $this->filterMeta['search_label'] ?? '-',
            'gender' => $genderRecap,
            'risks' => $finalRisks,
            'sudah_dipetakan' => $sudahDipetakan,
            'belum_dipetakan' => $belumDipetakan,
        ];

        return [
            new RingkasanRekapitulasiSheet($summary),
            new DetailDataPerizinanSheet(clone $this->query, $genderMap, $summary),
            new RekapitulasiGenderSheet($summary),
        ];
    }

    protected function buildGenderMapForQuery(Builder $baseQuery): array
    {
        return GenderNormalizer::resolveBusinessGenderMap($baseQuery);
    }
}
