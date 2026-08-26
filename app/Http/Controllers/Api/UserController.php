<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role') && $request->role !== 'semua' && $request->role !== 'Semua') {
            $query->where('role', $request->role);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(name) like ?', ['%' . $search . '%'])
                  ->orWhereRaw('LOWER(email) like ?', ['%' . $search . '%']);
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['Super Admin', 'Administrator', 'Verifier', 'Surveyor'])],
            'status' => ['required', Rule::in(['Aktif', 'Nonaktif'])],
        ]);

        $initials = collect(explode(' ', $request->name))->map(function($word) {
            return strtoupper(substr($word, 0, 1));
        })->take(2)->implode('');

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
            'avatar' => $initials,
            'actions' => 0
        ]);

        $this->logActivity('Membuat pengguna baru: ' . $user->name, $request->user());

        return response()->json(['message' => 'Pengguna berhasil dibuat', 'data' => $user], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['Super Admin', 'Administrator', 'Verifier', 'Surveyor'])],
            'status' => ['required', Rule::in(['Aktif', 'Nonaktif'])],
        ]);

        $initials = collect(explode(' ', $request->name))->map(function($word) {
            return strtoupper(substr($word, 0, 1));
        })->take(2)->implode('');

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'status' => $request->status,
            'avatar' => $initials
        ]);

        $this->logActivity('Memperbarui pengguna: ' . $user->name, $request->user());

        return response()->json(['message' => 'Data pengguna berhasil diperbarui', 'data' => $user]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20'
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'position' => $request->position,
            'phone' => $request->phone
        ]);

        $this->logActivity('Memperbarui profil akun sendiri', $user);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'data' => $user
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Delete old avatar if it's a file
            if ($user->avatar && !in_array(strlen($user->avatar), [1, 2])) {
                // simple length check to not delete initials like "AK"
                Storage::disk('public')->delete('avatars/' . basename($user->avatar));
            }
            
            $path = $file->storeAs('avatars', $filename, 'public');
            
            $user->update([
                'avatar' => '/storage/' . $path
            ]);
            
            $this->logActivity('Memperbarui foto profil', $user);

            return response()->json([
                'message' => 'Foto profil berhasil diperbarui',
                'avatar' => '/storage/' . $path
            ]);
        }
        
        return response()->json(['message' => 'File tidak ditemukan'], 400);
    }

    public function updateStatus(Request $request, $id)
    {
        $userToUpdate = User::findOrFail($id);
        $currentUser = $request->user();

        if ($currentUser && $currentUser->id === $userToUpdate->id) {
            return response()->json(['message' => 'Anda tidak dapat menonaktifkan akun sendiri.'], 403);
        }

        $request->validate([
            'status' => ['required', Rule::in(['Aktif', 'Nonaktif'])],
        ]);

        $userToUpdate->update(['status' => $request->status]);

        $action = $request->status === 'Aktif' ? 'Mengaktifkan' : 'Menonaktifkan';
        $this->logActivity($action . ' pengguna: ' . $userToUpdate->name, $currentUser);

        return response()->json(['message' => 'Status pengguna berhasil diperbarui']);
    }

    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed|different:old_password'
        ], [
            'new_password.confirmed' => 'Konfirmasi password baru tidak cocok.',
            'new_password.different' => 'Password baru tidak boleh sama dengan password lama.',
            'new_password.min' => 'Password baru minimal 8 karakter.'
        ]);

        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => [
                    'old_password' => ['Password lama tidak sesuai.']
                ]
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        $this->logActivity('Password pengguna diubah', $request->user());

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    public function getActivityLogs(Request $request)
    {
        $logs = ActivityLog::orderBy('created_at', 'desc')->limit(10)->get();
        
        $formatted = $logs->map(function($log) {
            return [
                'user' => $log->user_name,
                'action' => $log->action . ($log->business_name ? ' ' . $log->business_name : ''),
                'time' => $log->created_at->format('H:i'),
                'ip' => '127.0.0.1', // Assuming we don't have IP column yet
            ];
        });

        return response()->json($formatted);
    }

    private function logActivity(string $action, $user = null)
    {
        ActivityLog::create([
            'user_id' => $user ? $user->id : null,
            'user_name' => $user ? $user->name : 'System',
            'action' => $action,
        ]);
        
        if ($user) {
            $user->increment('actions');
        }
    }
}
