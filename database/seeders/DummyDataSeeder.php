<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\District;
use App\Models\Category;
use App\Models\Business;
use App\Models\ActivityLog;

class DummyDataSeeder extends Seeder
{
    public function run()
    {
        // 1. Users
        $users = [
            ['name' => 'Dr. Andi Kurniawan', 'email' => 'andi.k@pemkab.go.id', 'role' => 'Super Admin', 'status' => 'Aktif', 'avatar' => 'AK', 'actions' => 342],
            ['name' => 'Admin', 'email' => 'admin@admin.co.id', 'role' => 'Super Admin', 'status' => 'Aktif', 'avatar' => 'AK', 'actions' => 342],
            ['name' => 'Siti Rahayu, SE', 'email' => 'siti.r@pemkab.go.id', 'role' => 'Administrator', 'status' => 'Aktif', 'avatar' => 'SR', 'actions' => 218],
            ['name' => 'Budi Hartono', 'email' => 'budi.h@pemkab.go.id', 'role' => 'Verifier', 'status' => 'Aktif', 'avatar' => 'BH', 'actions' => 156],
            ['name' => 'Fitriani Dewi', 'email' => 'fitri.d@pemkab.go.id', 'role' => 'Surveyor', 'status' => 'Aktif', 'avatar' => 'FD', 'actions' => 89],
            ['name' => 'Rahmat Hidayat', 'email' => 'rahmat.h@pemkab.go.id', 'role' => 'Surveyor', 'status' => 'Aktif', 'avatar' => 'RH', 'actions' => 74],
            ['name' => 'Putri Anggraini', 'email' => 'putri.a@pemkab.go.id', 'role' => 'Verifier', 'status' => 'Nonaktif', 'avatar' => 'PA', 'actions' => 45],
            ['name' => 'Yusuf Hakim', 'email' => 'yusuf.h@pemkab.go.id', 'role' => 'Surveyor', 'status' => 'Aktif', 'avatar' => 'YH', 'actions' => 62],
        ];  

        foreach ($users as $user) {
            User::create(array_merge($user, ['password' => Hash::make('password')]));
        }

        // 2. Districts
        $districts = [
            ['code' => 'KEC001', 'name' => 'Kecamatan Pusat', 'villages' => 12, 'area' => '12.4 km²', 'population' => '125.430', 'status' => 'Aktif'],
            ['code' => 'KEC002', 'name' => 'Kecamatan Utara', 'villages' => 9, 'area' => '18.7 km²', 'population' => '98.210', 'status' => 'Aktif'],
            ['code' => 'KEC003', 'name' => 'Kecamatan Barat', 'villages' => 10, 'area' => '15.2 km²', 'population' => '112.780', 'status' => 'Aktif'],
            ['code' => 'KEC004', 'name' => 'Kecamatan Timur', 'villages' => 14, 'area' => '20.1 km²', 'population' => '143.560', 'status' => 'Aktif'],
            ['code' => 'KEC005', 'name' => 'Kecamatan Selatan', 'villages' => 11, 'area' => '22.8 km²', 'population' => '108.920', 'status' => 'Aktif'],
        ];

        foreach ($districts as $district) {
            District::create($district);
        }

        // 3. Categories
        $categories = [
            ['code' => 'KAT001', 'name' => 'Perdagangan Umum', 'desc' => 'Toko, kios, dan warung', 'total' => 892, 'status' => 'Aktif'],
            ['code' => 'KAT002', 'name' => 'Jasa & Layanan', 'desc' => 'Salon, bengkel, laundry', 'total' => 634, 'status' => 'Aktif'],
            ['code' => 'KAT003', 'name' => 'Kuliner & F&B', 'desc' => 'Restoran, warung makan, kafe', 'total' => 478, 'status' => 'Aktif'],
            ['code' => 'KAT004', 'name' => 'Industri Kecil', 'desc' => 'Pengolahan dan manufaktur', 'total' => 312, 'status' => 'Aktif'],
            ['code' => 'KAT005', 'name' => 'Properti & Konstruksi', 'desc' => 'Developer dan kontraktor', 'total' => 234, 'status' => 'Aktif'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // 4. Businesses (OSS structure)
        $businesses = [
            ['id_proyek' => 'PRJ-001', 'nib' => '220512345678', 'nama_perusahaan' => 'Toko Maju Bersama', 'risiko' => 'Rendah', 'kbli' => '47111', 'judul_kbli' => 'Perdagangan Umum', 'alamat_proyek' => 'Jl. Merdeka No 1', 'kecamatan' => 'Kecamatan Pusat', 'kelurahan' => 'Desa A', 'status_pm' => 'PMDN', 'status' => 'Aktif', 'tgl_terbit' => '2025-01-12', 'lat' => -0.5020, 'lng' => 117.1530, 'color' => '#2E7D32'],
            ['id_proyek' => 'PRJ-002', 'nib' => '220598765432', 'nama_perusahaan' => 'CV. Sukses Jaya', 'risiko' => 'Menengah Rendah', 'kbli' => '96200', 'judul_kbli' => 'Jasa & Layanan', 'alamat_proyek' => 'Jl. Sudirman No 4', 'kecamatan' => 'Kecamatan Utara', 'kelurahan' => 'Desa B', 'status_pm' => 'PMDN', 'status' => 'Aktif', 'tgl_terbit' => '2025-01-15', 'lat' => -0.4950, 'lng' => 117.1400, 'color' => '#2E7D32'],
            ['id_proyek' => 'PRJ-003', 'nib' => '220534521098', 'nama_perusahaan' => 'Warung Makan Bu Sri', 'risiko' => 'Rendah', 'kbli' => '56101', 'judul_kbli' => 'Kuliner & F&B', 'alamat_proyek' => 'Jl. Thamrin No 9', 'kecamatan' => 'Kecamatan Barat', 'kelurahan' => 'Desa C', 'status_pm' => 'PMDN', 'status' => 'Pending', 'tgl_terbit' => '2025-01-18', 'lat' => -0.5100, 'lng' => 117.1500, 'color' => '#F57F17'],
            ['id_proyek' => 'PRJ-004', 'nib' => '220511223344', 'nama_perusahaan' => 'UD. Karya Mandiri', 'risiko' => 'Menengah Tinggi', 'kbli' => '10799', 'judul_kbli' => 'Industri Kecil', 'alamat_proyek' => 'Jl. Gatot Subroto', 'kecamatan' => 'Kecamatan Timur', 'kelurahan' => 'Desa D', 'status_pm' => 'PMDN', 'status' => 'Kadaluarsa', 'tgl_terbit' => '2025-01-20', 'lat' => -0.5050, 'lng' => 117.1600, 'color' => '#E65100'],
            ['id_proyek' => 'PRJ-005', 'nib' => '220555667788', 'nama_perusahaan' => 'PT. Mitra Sentosa', 'risiko' => 'Tinggi', 'kbli' => '46900', 'judul_kbli' => 'Perdagangan Umum', 'alamat_proyek' => 'Jl. Asia Afrika', 'kecamatan' => 'Kecamatan Selatan', 'kelurahan' => 'Desa E', 'status_pm' => 'PMA', 'status' => 'Aktif', 'tgl_terbit' => '2025-01-22', 'lat' => -0.4900, 'lng' => 117.1650, 'color' => '#2E7D32'],
        ];

        foreach ($businesses as $business) {
            Business::create($business);
        }

        // 5. Activity Logs
        $activities = [
            ['time' => '09:42', 'action' => 'Usaha baru terdaftar', 'name' => 'Toko Maju Bersama', 'status_type' => 'new'],
            ['time' => '09:15', 'action' => 'Izin diverifikasi', 'name' => 'CV. Sukses Jaya', 'status_type' => 'approved'],
            ['time' => '08:58', 'action' => 'Izin kadaluarsa terdeteksi', 'name' => 'UD. Karya Mandiri', 'status_type' => 'expired'],
            ['time' => '08:30', 'action' => 'Pengajuan direvisi', 'name' => 'PT. Mitra Sentosa', 'status_type' => 'revision'],
            ['time' => '08:12', 'action' => 'Izin ditolak', 'name' => 'Bengkel Las Putra', 'status_type' => 'rejected'],
            ['time' => '07:45', 'action' => 'Data usaha diperbarui', 'name' => 'Apotek Sehat Selalu', 'status_type' => 'update'],
            ['time' => '07:20', 'action' => 'Usaha baru terdaftar', 'name' => 'Warung Makan Bu Tini', 'status_type' => 'new'],
        ];

        foreach ($activities as $activity) {
            ActivityLog::create($activity);
        }
    }
}
