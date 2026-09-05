<?php

namespace App\Services;

use App\Models\Business;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getDashboardData($forceRefresh = false)
    {
        if ($forceRefresh) {
            Cache::forget('dashboard_data');
        }

        return Cache::remember('dashboard_data', 3600, function () {
            return [
                'kpi' => $this->getKpiData(),
                'monthly' => $this->getMonthlyData(),
                'distribution' => $this->getDistributionData(),
                'districts' => $this->getDistrictData(),
                'activities' => $this->getActivityFeed(),
                'trend' => $this->getTrendData(),
                'markers' => $this->getMapMarkers(),
            ];
        });
    }

    private function getKpiData()
    {
        // Calculate current and previous periods for trends
        $thirtyDaysAgo = now()->subDays(30);

        // Helper to calculate percentage change
        $calcChange = function($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 1);
        };

        // Total
        $totalCurrent = Business::count();
        $totalPrevious = Business::where('created_at', '<', $thirtyDaysAgo)->count();
        $totalChange = $calcChange($totalCurrent, $totalPrevious);

        // Risk categories
        $risksQuery = Business::select('uraian_risiko_proyek', DB::raw('count(*) as total'))
            ->groupBy('uraian_risiko_proyek')
            ->orderBy('total', 'desc')
            ->get();
            
        $aggregatedRisks = [];
        foreach ($risksQuery as $risk) {
            $name = trim($risk->uraian_risiko_proyek ?? '');
            if (empty($name)) {
                $name = 'Tidak Diisi';
            }
            if (!isset($aggregatedRisks[$name])) {
                $aggregatedRisks[$name] = 0;
            }
            $aggregatedRisks[$name] += (int) $risk->total;
        }
        
        $finalRisks = [];
        foreach ($aggregatedRisks as $name => $val) {
            $finalRisks[] = [
                'name' => $name,
                'value' => $val,
            ];
        }

        usort($finalRisks, function($a, $b) {
            return $b['value'] <=> $a['value'];
        });

        return [
            'total' => [
                'value' => $totalCurrent,
                'change' => ($totalChange > 0 ? '+' : '') . $totalChange . '%',
                'up' => $totalChange >= 0
            ],
            'risks' => $finalRisks,
        ];
    }

    private function getMonthlyData()
    {
        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        
        $year = request()->query('year', date('Y'));
        
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

    private function getDistributionData()
    {
        $categoriesQuery = Business::select('judul_kbli', DB::raw('count(*) as total'))
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
        $otherCount = Business::whereNotIn('judul_kbli', $topCategories)->count();
        if ($otherCount > 0) {
            $distribution->push([
                'name' => 'Lainnya',
                'value' => $otherCount,
                'color' => '#B0BEC5'
            ]);
        }

        return $distribution;
    }

    private function getDistrictData()
    {
        $districtsQuery = Business::select('kecamatan_usaha', 
            DB::raw('count(*) as total'),
            DB::raw("SUM(CASE WHEN status = 'Aktif' THEN 1 ELSE 0 END) as active"),
            DB::raw("SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending"),
            DB::raw("SUM(CASE WHEN status = 'Kadaluarsa' THEN 1 ELSE 0 END) as expired")
        )
        ->groupBy('kecamatan_usaha')
        ->orderBy('total', 'desc')
        ->get();
            
        $distcolors = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#1B5E20', '#004D40'];
        return $districtsQuery->map(function($dist, $index) use ($distcolors) {
            $name = $dist->kecamatan_usaha ?: 'Tidak Diketahui';
            return [
                'name' => str_replace('Kecamatan ', 'Kec. ', $name),
                'total' => (int) $dist->total,
                'active' => (int) $dist->active,
                'pending' => (int) $dist->pending,
                'expired' => (int) $dist->expired,
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

    private function getMapMarkers()
    {
        return Business::select('id', 'latitude', 'longitude', 'status', 'nama_perusahaan')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('status', 'Aktif')
            ->take(200) // Prevent rendering too many markers at once
            ->get();
    }
}
