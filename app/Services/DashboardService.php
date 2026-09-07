<?php

namespace App\Services;

use App\Models\Business;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getDashboardData($year, $forceRefresh = false)
    {
        $cacheKey = "dashboard_data_{$year}";

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 3600, function () use ($year) {
            return [
                'kpi' => $this->getKpiData($year),
                'monthly' => $this->getMonthlyData($year),
                'distribution' => $this->getDistributionData($year),
                'districts' => $this->getDistrictData($year),
                'activities' => $this->getActivityFeed(),
                'trend' => $this->getTrendData(),
                'markers' => $this->getMapMarkers($year),
            ];
        });
    }

    private function getKpiData($year)
    {
        // Total by year
        $totalCurrent = Business::whereYear('tanggal_terbit_oss', $year)->count();
        $totalPrevious = Business::whereYear('tanggal_terbit_oss', $year - 1)->count();
        
        // Helper to calculate percentage change
        $calcChange = function($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 1);
        };
        $totalChange = $calcChange($totalCurrent, $totalPrevious);

        // Unmapped: NULL or zero decimal coordinates are considered invalid
        $belumDipetakan = $this->countUnmapped($year);

        // Risk categories explicitly mapped
        $risksQuery = Business::select('uraian_risiko_proyek', DB::raw('count(*) as total'))
            ->whereYear('tanggal_terbit_oss', $year)
            ->groupBy('uraian_risiko_proyek')
            ->orderBy('total', 'desc')
            ->get();
            
        $aggregatedRisks = [];
        
        $riskMap = [
            'Rendah' => 'Risiko Rendah',
            'Menengah Rendah' => 'Menengah Rendah',
            'Menengah Tinggi' => 'Menengah Tinggi',
            'Tinggi' => 'Risiko Tinggi',
        ];

        foreach ($risksQuery as $risk) {
            $name = trim($risk->uraian_risiko_proyek ?? '');
            
            if (isset($riskMap[$name])) {
                $mappedName = $riskMap[$name];
            } else {
                $mappedName = 'Tidak Diisi';
            }
            
            if (!isset($aggregatedRisks[$mappedName])) {
                $aggregatedRisks[$mappedName] = 0;
            }
            $aggregatedRisks[$mappedName] += (int) $risk->total;
        }
        
        $finalRisks = [];
        foreach ($aggregatedRisks as $name => $val) {
            $finalRisks[] = [
                'name' => $name,
                'value' => $val,
            ];
        }

        return [
            'total' => [
                'value' => $totalCurrent,
                'change' => ($totalChange > 0 ? '+' : '') . $totalChange . '%',
                'up' => $totalChange >= 0
            ],
            'risks' => $finalRisks,
            'belum_dipetakan' => $belumDipetakan,
        ];
    }

    private function getMonthlyData($year)
    {
        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        
        $monthlyQuery = Business::select(
                DB::raw('EXTRACT(MONTH FROM tanggal_terbit_oss) as month'), 
                'status', 
                DB::raw('count(*) as total')
            )
            ->whereYear('tanggal_terbit_oss', $year)
            ->groupBy(DB::raw('EXTRACT(MONTH FROM tanggal_terbit_oss)'), 'status')
            ->get();
            
        $monthly = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthData = $monthlyQuery->where('month', $i);
            $monthly[] = [
                'month' => $monthNames[$i - 1],
                'registrasi' => (int) $monthData->sum('total'),
                'terverifikasi' => (int) $monthData->where('status', 'Aktif')->sum('total'),
                'ditolak' => (int) $monthData->whereIn('status', ['Ditolak', 'Kadaluarsa'])->sum('total'),
            ];
        }

        return $monthly;
    }

    private function getDistributionData($year)
    {
        $categoriesQuery = Business::select('judul_kbli', DB::raw('count(*) as total'))
            ->whereYear('tanggal_terbit_oss', $year)
            ->groupBy('judul_kbli')
            ->orderBy('total', 'desc')
            ->take(5)
            ->get();
            
        $colors = ['#2E7D32', '#1565C0', '#F57C00', '#7B1FA2', '#00838F', '#66BB6A'];
        
        $distribution = $categoriesQuery->map(function($cat, $index) use ($colors) {
            return [
                'name' => $cat->judul_kbli ?: 'Tanpa Kategori',
                'value' => (int) $cat->total,
                'color' => $colors[$index % count($colors)],
            ];
        });
        
        $topCategories = $categoriesQuery->pluck('judul_kbli')->toArray();
        $otherCount = Business::whereYear('tanggal_terbit_oss', $year)->whereNotIn('judul_kbli', $topCategories)->count();
        if ($otherCount > 0) {
            $distribution->push([
                'name' => 'Lainnya',
                'value' => $otherCount,
                'color' => '#B0BEC5'
            ]);
        }

        return $distribution;
    }

    private function getDistrictData($year)
    {
        $districtsQuery = Business::select('kecamatan_usaha', 
            DB::raw('count(*) as total'),
            DB::raw("SUM(CASE WHEN LOWER(TRIM(uraian_risiko_proyek)) = 'rendah' THEN 1 ELSE 0 END) as risiko_rendah"),
            DB::raw("SUM(CASE WHEN LOWER(TRIM(uraian_risiko_proyek)) IN ('menengah rendah', 'menengah tinggi') THEN 1 ELSE 0 END) as risiko_menengah"),
            DB::raw("SUM(CASE WHEN LOWER(TRIM(uraian_risiko_proyek)) = 'tinggi' THEN 1 ELSE 0 END) as risiko_tinggi")
        )
        ->whereYear('tanggal_terbit_oss', $year)
        ->groupBy('kecamatan_usaha')
        ->orderBy('total', 'desc')
        ->get();
            
        $distcolors = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#1B5E20', '#004D40'];
        return $districtsQuery->map(function($dist, $index) use ($distcolors) {
            $name = $dist->kecamatan_usaha ?: 'Tidak Diketahui';
            return [
                'name' => str_replace('Kecamatan ', 'Kec. ', $name),
                'total' => (int) $dist->total,
                'risiko_rendah' => (int) $dist->risiko_rendah,
                'risiko_menengah' => (int) $dist->risiko_menengah,
                'risiko_tinggi' => (int) $dist->risiko_tinggi,
                'color' => $distcolors[$index % count($distcolors)],
            ];
        });
    }

    private function getActivityFeed()
    {
        $activities = ActivityLog::latest()->take(7)->get();
        $activityFeed = $activities->map(function($act) {
            return [
                'time' => $act->created_at ? $act->created_at->format('H:i') : null,
                'action' => $act->action,
                'name' => $act->name,
                'status' => $act->status_type
            ];
        });
        
        if ($activityFeed->isEmpty()) {
            $recent = Business::orderBy('created_at', 'desc')->take(5)->get();
            $activityFeed = $recent->map(function($biz) {
                return [
                    'time' => $biz->created_at ? $biz->created_at->format('H:i') : now()->format('H:i'),
                    'action' => 'Pendaftaran Usaha',
                    'name' => $biz->nama_perusahaan,
                    'status' => 'new'
                ];
            });
        }

        return $activityFeed;
    }

    private function getTrendData()
    {
        $trendQuery = Business::select(DB::raw('EXTRACT(YEAR FROM tanggal_terbit_oss) as year'), 'status', DB::raw('count(*) as total'))
            ->whereNotNull('tanggal_terbit_oss')
            ->groupBy(DB::raw('EXTRACT(YEAR FROM tanggal_terbit_oss)'), 'status')
            ->orderBy('year', 'asc')
            ->get();
            
        $years = $trendQuery->pluck('year')->unique()->sort()->values();
        return $years->map(function($year) use ($trendQuery) {
            $yearData = $trendQuery->where('year', $year);
            return [
                'year' => (string) $year,
                'total' => (int) $yearData->sum('total'),
                'active' => (int) $yearData->where('status', 'Aktif')->sum('total'),
                'expired' => (int) $yearData->where('status', 'Kadaluarsa')->sum('total'),
            ];
        })->values();
    }

    private function getMapMarkers($year)
    {
        return Business::select('id', 'latitude', 'longitude', 'status', 'nama_perusahaan')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('status', 'Aktif')
            ->whereYear('tanggal_terbit_oss', $year)
            ->take(200) // Prevent rendering too many markers at once
            ->get();
    }

    /**
     * Count businesses that have no valid map coordinates.
     * A coordinate is considered invalid when it is:
     *   - NULL, OR
     *   - equal to 0 (decimal 0.00000000 is not a real location)
     *
     * Uses a raw COUNT so it works correctly with PostgreSQL decimal columns.
     */
    private function countUnmapped($year): int
    {
        $result = DB::selectOne(
            "SELECT COUNT(*) AS cnt
             FROM businesses
             WHERE (latitude IS NULL
                OR longitude IS NULL
                OR latitude = 0
                OR longitude = 0)
                AND EXTRACT(YEAR FROM tanggal_terbit_oss) = ?", [$year]
        );

        return (int) ($result->cnt ?? 0);
    }
}
