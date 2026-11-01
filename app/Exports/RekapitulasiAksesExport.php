<?php

namespace App\Exports;

use App\Exports\Sheets\DetailDataAksesSheet;
use App\Exports\Sheets\RekapitulasiGenderSheet;
use App\Exports\Sheets\RingkasanRekapitulasiSheet;
use App\Support\GenderNormalizer;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class RekapitulasiAksesExport implements WithMultipleSheets
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

        // Use the exact same GenderNormalizer::aggregateForAccessLogsQuery calculation as PublicMapAccessLogController::index()
        $genderRecap = GenderNormalizer::aggregateForAccessLogsQuery(clone $baseQuery);
        $totalAll = (int) ($genderRecap['total'] ?? 0);

        $summary = [
            'exported_at'           => now()->locale('id')->translatedFormat('d F Y, H:i') . ' WITA',
            'filter_year_label'     => $this->filterMeta['year_label'] ?? 'Semua Periode',
            'filter_location_label' => $this->filterMeta['location_label'] ?? 'Semua Instansi',
            'filter_status_label'   => $this->filterMeta['status_label'] ?? 'Pengunjung Terverifikasi NIK',
            'filter_search_label'   => $this->filterMeta['search_label'] ?? '-',
            'gender'                => $genderRecap,
            'risks'                 => [],
            'sudah_dipetakan'       => $totalAll,
            'belum_dipetakan'       => 0,
        ];

        return [
            new RingkasanRekapitulasiSheet($summary),
            new DetailDataAksesSheet(clone $this->query, $summary),
            new RekapitulasiGenderSheet($summary),
        ];
    }
}

