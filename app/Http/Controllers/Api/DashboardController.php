<?php

namespace App\Http\Controllers\Api;

use App\Exports\RekapitulasiPerizinanExport;
use App\Http\Controllers\Controller;
use App\Repositories\BusinessRepository;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(Request $request)
    {
        $forceRefresh = $request->query('refresh') === 'true';
        $year = $request->query('year');
        $data = $this->dashboardService->getDashboardData($year, $forceRefresh);
        return response()->json($data);
    }

    public function exportExcel(Request $request, BusinessRepository $repository)
    {
        if ($request->query('source') === 'access_logs') {
            return app(PublicMapAccessLogController::class)->exportExcel($request);
        }

        // Normalize year -> tahun so BusinessRepository::getFilteredQuery applies it consistently
        $year = $request->query('year') ?: $request->query('tahun');
        if ($year && $year !== 'Semua' && $year !== 'all') {
            $request->merge(['tahun' => $year]);
        }

        $query = $repository->getFilteredQuery($request);

        // Optional date range filter if start_date / end_date are supplied
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        if (!empty($startDate) && !empty($endDate)) {
            if ($startDate > $endDate) {
                [$startDate, $endDate] = [$endDate, $startDate];
            }
            $query->whereDate('tanggal_terbit_oss', '>=', $startDate)
                ->whereDate('tanggal_terbit_oss', '<=', $endDate);
        } elseif (!empty($startDate)) {
            $query->whereDate('tanggal_terbit_oss', '>=', $startDate);
        } elseif (!empty($endDate)) {
            $query->whereDate('tanggal_terbit_oss', '<=', $endDate);
        }

        // Build human-readable filter metadata for the Excel Summary Sheet
        $yearLabel = ($year && $year !== 'Semua' && $year !== 'all') ? "Tahun {$year}" : 'Semua Tahun';
        if (!empty($startDate) || !empty($endDate)) {
            $yearLabel .= sprintf(' (%s s/d %s)', $startDate ?: 'Awal', $endDate ?: 'Sekarang');
        }

        $locParts = [];
        if ($request->filled('kecamatan_usaha') && $request->query('kecamatan_usaha') !== 'Semua') {
            $locParts[] = 'Kec. ' . $request->query('kecamatan_usaha');
        }
        if ($request->filled('kelurahan_usaha') && $request->query('kelurahan_usaha') !== 'Semua') {
            $locParts[] = 'Kel. ' . $request->query('kelurahan_usaha');
        }
        $locationLabel = !empty($locParts) ? implode(' / ', $locParts) : 'Semua Wilayah';

        $statusParts = [];
        if ($request->filled('status') && $request->query('status') !== 'Semua') {
            $statusParts[] = 'Status: ' . $request->query('status');
        }
        $risikoParam = $request->query('uraian_risiko_proyek') ?: $request->query('risiko');
        if (!empty($risikoParam) && $risikoParam !== 'Semua') {
            $statusParts[] = 'Risiko: ' . $risikoParam;
        }
        if ($request->filled('status_pemetaan') && $request->query('status_pemetaan') !== 'Semua') {
            $statusParts[] = 'Pemetaan: ' . $request->query('status_pemetaan');
        }
        $statusLabel = !empty($statusParts) ? implode(' | ', $statusParts) : 'Semua Status & Risiko';

        $filterMeta = [
            'year_label' => $yearLabel,
            'location_label' => $locationLabel,
            'status_label' => $statusLabel,
            'search_label' => $request->filled('search') ? $request->query('search') : '-',
        ];

        $filename = 'Rekapitulasi_Data_Perizinan_' . date('Y-m-d') . '.xlsx';

        return Excel::download(new RekapitulasiPerizinanExport($query, $filterMeta), $filename);
    }
}
