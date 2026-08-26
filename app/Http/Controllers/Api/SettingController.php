<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLog;
use App\Models\User;

class SettingController extends Controller
{
    /**
     * Get current user's settings
     */
    public function index()
    {
        $user = Auth::user();
        
        return response()->json([
            'status' => 'success',
            'data' => $user->settings ?? []
        ]);
    }

    /**
     * Update user's settings (partial update supported)
     */
    public function update(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $currentSettings = $user->settings ?? [];
        
        // Ensure settings is an array
        if (is_string($currentSettings)) {
            $currentSettings = json_decode($currentSettings, true) ?? [];
        }
        
        // Merge the incoming payload with existing settings
        $newSettings = array_merge($currentSettings, $request->all());
        
        $user->settings = $newSettings;
        $user->save();
        
        try {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'Update Settings',
                'description' => 'Memperbarui pengaturan sistem',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        } catch (\Exception $e) {
            // Ignore if ActivityLog fails
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan berhasil disimpan',
            'data' => $user->settings
        ]);
    }
}
