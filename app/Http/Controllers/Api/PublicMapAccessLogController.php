<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicMapAccessLog;
use App\Models\PublicMapVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PublicMapAccessLogController extends Controller
{
    /**
     * Store visitor public map access using a short-lived, single-use verification token.
     * The verified NIK is retrieved server-side from the verification record.
     * Client-supplied NIK is rejected.
     */
    public function store(Request $request)
    {
        // Reject direct client-supplied NIK
        if ($request->has('nik')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pengiriman NIK langsung tidak diizinkan. Gunakan token verifikasi.',
                'errors'  => ['nik' => ['Pengiriman NIK tidak diizinkan.']],
            ], 422);
        }

        $validated = $request->validate([
            'verification_token' => 'required|string',
            'nama'               => 'required|string|min:2|max:255',
            'instansi'           => 'required|string|min:2|max:255',
        ], [
            'verification_token.required' => 'Token verifikasi wajib disertakan.',
            'nama.required'               => 'Nama wajib diisi.',
            'nama.min'                    => 'Nama minimal 2 karakter.',
            'instansi.required'           => 'Instansi wajib diisi.',
            'instansi.min'                => 'Instansi minimal 2 karakter.',
        ]);

        $nama     = trim($validated['nama']);
        $instansi = trim($validated['instansi']);

        if (empty($nama) || empty($instansi)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Nama dan Instansi tidak boleh hanya berisi spasi.',
                'errors'  => [
                    'nama'     => empty($nama)     ? ['Nama tidak boleh kosong.'] : [],
                    'instansi' => empty($instansi) ? ['Instansi tidak boleh kosong.'] : [],
                ],
            ], 422);
        }

        $tokenHash = hash('sha256', $validated['verification_token']);

        // Execute atomic verification consumption & log creation within row lock
        $result = DB::transaction(function () use ($tokenHash, $nama, $instansi, $request) {
            $verification = PublicMapVerification::where('token_hash', $tokenHash)
                ->lockForUpdate()
                ->first();

            if (!$verification) {
                return [
                    'status'  => 'error',
                    'code'    => 422,
                    'message' => 'Token verifikasi tidak valid atau tidak ditemukan.',
                    'errors'  => ['verification_token' => ['Token verifikasi tidak valid.']],
                ];
            }

            if ($verification->isUsed()) {
                return [
                    'status'  => 'error',
                    'code'    => 422,
                    'message' => 'Token verifikasi sudah pernah digunakan.',
                    'errors'  => ['verification_token' => ['Token verifikasi sudah pernah digunakan.']],
                ];
            }

            if ($verification->isExpired()) {
                return [
                    'status'  => 'error',
                    'code'    => 422,
                    'message' => 'Token verifikasi telah kedaluwarsa.',
                    'errors'  => ['verification_token' => ['Token verifikasi telah kedaluwarsa. Silakan verifikasi ulang NIK.']],
                ];
            }

            // Verify that submitted nama matches the verified name
            if (strcasecmp(trim($verification->verified_name), $nama) !== 0) {
                return [
                    'status'  => 'error',
                    'code'    => 422,
                    'message' => 'Nama tidak sesuai dengan data NIK terverifikasi.',
                    'errors'  => ['nama' => ['Nama tidak sesuai dengan nama yang terverifikasi.']],
                ];
            }

            // Consume token atomically
            $verification->update([
                'used_at' => now(),
            ]);

            // Create access log using server-authoritative verified NIK
            $log = PublicMapAccessLog::create([
                'nama'        => $verification->verified_name,
                'instansi'    => $instansi,
                'nik'         => $verification->verified_nik,
                'accessed_at' => now(),
                'ip_address'  => $request->ip(),
                'user_agent'  => substr($request->userAgent() ?? '', 0, 500),
            ]);

            return [
                'status' => 'success',
                'code'   => 201,
                'log'    => $log,
            ];
        });

        if ($result['status'] === 'error') {
            return response()->json([
                'status'  => 'error',
                'message' => $result['message'],
                'errors'  => $result['errors'],
            ], $result['code']);
        }

        $log = $result['log'];

        return response()->json([
            'status'  => 'success',
            'success' => true,
            'message' => 'Akses Peta PB berhasil dicatat.',
            'data'    => [
                'id'            => $log->id,
                'access_log_id' => $log->id,
                'nama'          => $log->nama,
                'instansi'      => $log->instansi,
                'accessed_at'   => $log->accessed_at,
            ],
        ], 201);
    }

    /**
     * Get paginated access logs for admin recap.
     */
    public function index(Request $request)
    {
        $query = PublicMapAccessLog::with(['feedback.business:id,nama_perusahaan']);

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

        // Filter by Date Range (with validation start_date <= end_date)
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        if (!empty($startDate) && !empty($endDate)) {
            if ($startDate > $endDate) {
                [$startDate, $endDate] = [$endDate, $startDate];
            }
            $query->whereDate('accessed_at', '>=', $startDate)
                  ->whereDate('accessed_at', '<=', $endDate);
        } elseif (!empty($startDate)) {
            $query->whereDate('accessed_at', '>=', $startDate);
        } elseif (!empty($endDate)) {
            $query->whereDate('accessed_at', '<=', $endDate);
        }

        // Aggregate statistics
        $today = Carbon::today();
        $totalAccess = PublicMapAccessLog::count();
        $totalVisitors = (int) PublicMapAccessLog::selectRaw("COUNT(DISTINCT CONCAT(LOWER(TRIM(nama)), ':::', LOWER(TRIM(instansi)))) as count")->value('count');
        $todayAccess = PublicMapAccessLog::whereDate('accessed_at', $today)->count();
        $totalAgencies = PublicMapAccessLog::distinct('instansi')->count('instansi');
        $totalFeedbacks = \App\Models\PublicMapFeedback::count();

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
                'total_feedbacks' => $totalFeedbacks,
                'agencies_list' => $agenciesList,
            ],
            'data' => $logs,
        ]);
    }
}
