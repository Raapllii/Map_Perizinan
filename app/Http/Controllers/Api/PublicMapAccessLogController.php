<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicMapAccessLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PublicMapAccessLogController extends Controller
{
    /**
     * Store visitor public map access.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|min:2|max:255',
            'instansi' => 'required|string|min:2|max:255',
        ], [
            'nama.required' => 'Nama wajib diisi.',
            'nama.min' => 'Nama minimal 2 karakter.',
            'instansi.required' => 'Instansi wajib diisi.',
            'instansi.min' => 'Instansi minimal 2 karakter.',
        ]);

        $nama = trim($validated['nama']);
        $instansi = trim($validated['instansi']);

        if (empty($nama) || empty($instansi)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nama dan Instansi tidak boleh hanya berisi spasi.',
                'errors' => [
                    'nama' => empty($nama) ? ['Nama tidak boleh kosong.'] : [],
                    'instansi' => empty($instansi) ? ['Instansi tidak boleh kosong.'] : [],
                ]
            ], 422);
        }

        $log = PublicMapAccessLog::create([
            'nama' => $nama,
            'instansi' => $instansi,
            'accessed_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Akses Peta PB berhasil dicatat.',
            'data' => [
                'id' => $log->id,
                'nama' => $log->nama,
                'instansi' => $log->instansi,
                'accessed_at' => $log->accessed_at,
            ],
        ], 201);
    }

    /**
     * Get paginated access logs for admin recap.
     */
    public function index(Request $request)
    {
        $query = PublicMapAccessLog::query();

        // Search by Nama or Instansi
        if ($request->filled('search')) {
            $search = strtolower(trim($request->search));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(instansi) LIKE ?', ["%{$search}%"]);
            });
        }

        // Filter by Instansi
        if ($request->filled('instansi') && $request->instansi !== 'Semua') {
            $query->where('instansi', $request->instansi);
        }

        // Filter by Date Range
        if ($request->filled('start_date')) {
            $query->whereDate('accessed_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('accessed_at', '<=', $request->end_date);
        }

        // Aggregate statistics
        $today = Carbon::today();
        $totalAccess = PublicMapAccessLog::count();
        $totalVisitors = (int) PublicMapAccessLog::selectRaw("COUNT(DISTINCT CONCAT(LOWER(TRIM(nama)), ':::', LOWER(TRIM(instansi)))) as count")->value('count');
        $todayAccess = PublicMapAccessLog::whereDate('accessed_at', $today)->count();
        $totalAgencies = PublicMapAccessLog::distinct('instansi')->count('instansi');

        $perPage = min((int) $request->get('per_page', 15), 100);
        $logs = $query->orderBy('accessed_at', 'desc')->paginate($perPage);

        // Get distinct agencies list for filter dropdown
        $agenciesList = PublicMapAccessLog::select('instansi')
            ->distinct()
            ->orderBy('instansi', 'asc')
            ->pluck('instansi');

        return response()->json([
            'status' => 'success',
            'meta' => [
                'total_access' => $totalAccess,
                'total_visitors' => $totalVisitors,
                'today_access' => $todayAccess,
                'total_agencies' => $totalAgencies,
                'agencies_list' => $agenciesList,
            ],
            'data' => $logs,
        ]);
    }
}
