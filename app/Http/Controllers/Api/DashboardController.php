<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Category;
use App\Models\District;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_data', 3600, function () {
            // 1. KPI Data
            $totalBusinesses = Business::count();
            $activeBusinesses = Business::where('status', 'Aktif')->count();
            $pendingBusinesses = Business::where('status', 'Pending')->count();
            $expiredBusinesses = Business::where('status', 'Kadaluarsa')->count();
            $rejectedBusinesses = Business::where('status', 'Ditolak')->count();
            
            $kpi = [
                'total' => $totalBusinesses,
                'active' => $activeBusinesses,
                'pending' => $pendingBusinesses,
                'expired' => $expiredBusinesses,
                'rejected' => $rejectedBusinesses,
                'new' => Business::where('tgl_terbit', '>=', now()->subDays(30))->count(),
            ];

            // 2. Monthly Data (Year 2024 based on OSS data)
            $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            
            $monthlyQuery = Business::select(
                    \Illuminate\Support\Facades\DB::raw('MONTH(tgl_terbit) as month'), 
                    'status', 
                    \Illuminate\Support\Facades\DB::raw('count(*) as total')
                )
                ->whereYear('tgl_terbit', '2024')
                ->groupBy(\Illuminate\Support\Facades\DB::raw('MONTH(tgl_terbit)'), 'status')
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

            // 3. Distribution Data
            $categoriesQuery = Business::select('judul_kbli', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
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

            // 4. District Data (Optimized with conditional aggregation to avoid N+1)
            $districtsQuery = Business::select('kecamatan', 
                \Illuminate\Support\Facades\DB::raw('count(*) as total'),
                \Illuminate\Support\Facades\DB::raw("SUM(CASE WHEN status = 'Aktif' THEN 1 ELSE 0 END) as active"),
                \Illuminate\Support\Facades\DB::raw("SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending"),
                \Illuminate\Support\Facades\DB::raw("SUM(CASE WHEN status = 'Kadaluarsa' THEN 1 ELSE 0 END) as expired")
            )
            ->groupBy('kecamatan')
            ->orderBy('total', 'desc')
            ->get();
                
            $distcolors = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#1B5E20', '#004D40'];
            $districtData = $districtsQuery->map(function($dist, $index) use ($distcolors) {
                $name = $dist->kecamatan ?: 'Tidak Diketahui';
                return [
                    'name' => str_replace('Kecamatan ', 'Kec. ', $name),
                    'total' => (int) $dist->total,
                    'active' => (int) $dist->active,
                    'pending' => (int) $dist->pending,
                    'expired' => (int) $dist->expired,
                    'color' => $distcolors[$index % count($distcolors)],
                ];
            });

            // 5. Activity Feed
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

            // 6. Trend Data (yearly)
            $trendQuery = Business::select(\Illuminate\Support\Facades\DB::raw('YEAR(tgl_terbit) as year'), 'status', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
                ->whereNotNull('tgl_terbit')
                ->groupBy(\Illuminate\Support\Facades\DB::raw('YEAR(tgl_terbit)'), 'status')
                ->orderBy('year', 'asc')
                ->get();
                
            $years = $trendQuery->pluck('year')->unique()->sort()->values();
            $trend = $years->map(function($year) use ($trendQuery) {
                $yearData = $trendQuery->where('year', $year);
                return [
                    'year' => (string) $year,
                    'total' => (int) $yearData->sum('total'),
                    'active' => (int) $yearData->where('status', 'Aktif')->sum('total'),
                    'expired' => (int) $yearData->where('status', 'Kadaluarsa')->sum('total'),
                ];
            });

            return [
                'kpi' => $kpi,
                'monthly' => $monthly,
                'distribution' => $distribution,
                'districts' => $districtData,
                'activities' => $activityFeed,
                'trend' => $trend,
            ];
        });

        return response()->json($data);
    }
}
