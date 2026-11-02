<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBusinessRequest;
use App\Http\Requests\UpdateBusinessRequest;
use App\Models\PublicMapServiceSurvey;
use App\Services\BusinessService;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    protected $businessService;

    public function __construct(BusinessService $businessService)
    {
        $this->businessService = $businessService;
    }

    public function index(Request $request)
    {
        if ($request->boolean('map')) {
            $markers = $this->businessService->getBusinessesForMap($request);
            return response()->json($markers);
        }

        $data = $this->businessService->getBusinessesForDataTable($request);
        return response()->json($data);
    }

    public function search(Request $request)
    {
        $results = $this->businessService->search($request);
        return response()->json($results);
    }

    public function show($id)
    {
        $business = $this->businessService->show((int)$id);

        // SEC-06: Mask sensitive personal data if accessed by unauthenticated public visitor
        if (!auth()->check()) {
            if (!empty($business->email)) {
                $parts = explode('@', (string)$business->email);
                $namePart = $parts[0] ?? '';
                $domainPart = $parts[1] ?? '';
                $maskedName = mb_strlen($namePart) > 2 ? mb_substr($namePart, 0, 2) . '***' : '***';
                $business->email = $maskedName . '@' . $domainPart;
            }

            if (!empty($business->nomor_telp)) {
                $telp = (string)$business->nomor_telp;
                $len = strlen($telp);
                $business->nomor_telp = $len > 6 ? substr($telp, 0, 4) . '****' . substr($telp, -3) : '****';
            }

            if (!empty($business->nik_pemohon)) {
                $nik = (string)$business->nik_pemohon;
                $business->nik_pemohon = strlen($nik) >= 16 ? substr($nik, 0, 6) . '******' . substr($nik, -4) : '************';
            }

            if (!empty($business->nama_user)) {
                $names = explode(' ', trim((string)$business->nama_user));
                $maskedNames = array_map(function ($part) {
                    $l = mb_strlen($part);
                    return $l > 2 ? mb_substr($part, 0, 1) . str_repeat('*', $l - 1) : $part;
                }, $names);
                $business->nama_user = implode(' ', $maskedNames);
            }
        }

        return response()->json($business);
    }

    /**
     * Download business detail PDF for authenticated Admin users (no survey required).
     */
    public function downloadPdfAdmin($id)
    {
        $business = $this->businessService->show((int)$id);
        return $this->businessService->generatePdf($business);
    }

    /**
     * Download business detail PDF for Public Map visitors (requires completed SKM survey).
     */
    public function downloadPdf(Request $request, $id)
    {
        $business = $this->businessService->show((int)$id);

        // If caller is an authenticated, active admin user, permit direct download
        $authUser = auth('sanctum')->user() ?? auth()->user() ?? auth('web')->user();
        if ($authUser && ($authUser->status === 'Aktif' || (method_exists($authUser, 'isActive') && $authUser->isActive()))) {
            return $this->businessService->generatePdf($business);
        }

        // Public Map visitor: strictly enforce completed survey in public_map_service_surveys
        $accessLogId = $request->input('access_log_id') ?? $request->header('X-Access-Log-Id');
        $surveyId = $request->input('survey_id');

        if (!$accessLogId || !is_numeric($accessLogId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan isi Survei Kepuasan Pelayanan (SKM) terlebih dahulu sebelum mengunduh detail izin usaha.',
                'requires_survey' => true,
            ], 403);
        }

        $surveyQuery = PublicMapServiceSurvey::where('business_id', $business->id)
            ->where('public_map_access_log_id', (int)$accessLogId);

        if ($surveyId && is_numeric($surveyId)) {
            $surveyQuery->where('id', (int)$surveyId);
        }

        if (!$surveyQuery->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan isi Survei Kepuasan Pelayanan (SKM) terlebih dahulu sebelum mengunduh detail izin usaha.',
                'requires_survey' => true,
            ], 403);
        }

        return $this->businessService->generatePdf($business);
    }

    public function store(StoreBusinessRequest $request)
    {
        $business = $this->businessService->store($request->validated());
        return response()->json(['message' => 'Usaha berhasil ditambahkan', 'data' => $business], 201);
    }

    public function update(UpdateBusinessRequest $request, $id)
    {
        $business = $this->businessService->update($id, $request->validated());
        return response()->json(['message' => 'Data usaha berhasil diperbarui', 'data' => $business]);
    }

    public function destroy($id)
    {
        if (auth()->check() && !auth()->user()->hasRole('Super Admin', 'Administrator')) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses untuk menghapus data usaha.'], 403);
        }

        $this->businessService->destroy($id);
        return response()->json(['message' => 'Data usaha berhasil dihapus']);
    }

    public function bulkDestroy(Request $request)
    {
        if (auth()->check() && !auth()->user()->hasRole('Super Admin', 'Administrator')) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses untuk menghapus massal data usaha.'], 403);
        }

        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $count = $this->businessService->bulkDestroy($request->input('ids'), $request->user());

        return response()->json([
            'status' => 'success',
            'message' => "{$count} data usaha berhasil dihapus",
            'count' => $count
        ]);
    }
}
