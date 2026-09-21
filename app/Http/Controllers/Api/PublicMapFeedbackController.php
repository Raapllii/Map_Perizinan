<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicMapFeedback;
use Illuminate\Http\Request;

class PublicMapFeedbackController extends Controller
{
    /**
     * Store feedback from public map visitor.
     */
    public function store(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'access_log_id' => 'required|integer|exists:public_map_access_logs,id',
            'rating' => 'required|string|in:very-sad,sad,neutral,happy',
            'feedback' => 'required|string|min:2|max:3000',
            'business_id' => 'nullable|integer|exists:businesses,id',
        ], [
            'access_log_id.required' => 'Identitas akses peta (access_log_id) wajib disertakan.',
            'access_log_id.integer' => 'Format access_log_id tidak valid.',
            'access_log_id.exists' => 'Data log akses tidak ditemukan.',
            'rating.required' => 'Penilaian rating wajib dipilih.',
            'rating.in' => 'Pilihan rating tidak valid.',
            'feedback.required' => 'Pesan masukan wajib diisi.',
            'feedback.min' => 'Pesan masukan minimal 2 karakter.',
            'feedback.max' => 'Pesan masukan maksimal 3000 karakter.',
            'business_id.exists' => 'Data usaha tidak ditemukan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $feedbackText = trim($validated['feedback']);
        if (strlen($feedbackText) < 2) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesan masukan minimal 2 karakter.',
                'errors' => [
                    'feedback' => ['Pesan masukan tidak boleh hanya berisi spasi.'],
                ],
            ], 422);
        }

        $feedback = PublicMapFeedback::create([
            'public_map_access_log_id' => $validated['access_log_id'],
            'business_id' => $validated['business_id'] ?? null,
            'rating' => $validated['rating'],
            'feedback' => $feedbackText,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Terima kasih, masukan Anda berhasil disimpan.',
            'data' => $feedback,
        ], 201);
    }
}
