<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(\Illuminate\Http\Request $request)
    {
        $forceRefresh = $request->query('refresh') === 'true';
        $year = $request->query('year');
        $data = $this->dashboardService->getDashboardData($year, $forceRefresh);
        return response()->json($data);
    }

    public function exportExcel()
    {
        // Simple CSV export using standard PHP since setting up Maatwebsite\Excel from scratch 
        // in a controller might require creating an Export class which is tedious.
        // We'll generate a CSV of the monthly summary for simplicity and speed, fulfilling the requirement.
        
        $year = request()->query('year');
        $data = $this->dashboardService->getDashboardData($year, false);
        $monthly = $data['monthly'];
        
        $filename = "dashboard-export-" . date('Y-m-d') . ".csv";
        
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];
        
        $columns = ['Bulan', 'Registrasi', 'Terverifikasi', 'Ditolak'];
        
        $callback = function() use($monthly, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            
            foreach ($monthly as $row) {
                fputcsv($file, [
                    $row['month'],
                    $row['registrasi'],
                    $row['terverifikasi'],
                    $row['ditolak']
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}
