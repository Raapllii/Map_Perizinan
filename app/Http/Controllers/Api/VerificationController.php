<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BusinessService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VerificationController extends Controller
{
    protected $businessService;

    public function __construct(BusinessService $businessService)
    {
        $this->businessService = $businessService;
    }

    public function verify(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', Rule::in(['Aktif', 'Ditolak', 'Revision', 'Pending', 'Kadaluarsa'])],
            'note' => 'nullable|string'
        ]);

        $business = $this->businessService->updateStatus($id, $request->status, $request->note, $request->user());

        return response()->json([
            'message' => 'Status verifikasi berhasil diperbarui',
            'data' => $business
        ]);
    }
}
