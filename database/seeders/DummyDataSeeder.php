<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Category;
use App\Models\Business;
use App\Models\ActivityLog;
use App\Models\PublicMapAccessLog;
use App\Models\PublicMapFeedback;
use App\Models\BusinessIndicator;

class DummyDataSeeder extends Seeder
{
    public function run()
    {
        // 1. Users
        $users = [
            ['name' => 'Dr. Andi Kurniawan', 'email' => 'andi.k@pemkab.go.id', 'role' => 'Super Admin', 'status' => 'Aktif', 'avatar' => 'AK', 'actions' => 342],
            ['name' => 'Siti Rahayu, SE', 'email' => 'siti.r@pemkab.go.id', 'role' => 'Administrator', 'status' => 'Aktif', 'avatar' => 'SR', 'actions' => 218],
            ['name' => 'Budi Hartono', 'email' => 'budi.h@pemkab.go.id', 'role' => 'Verifier', 'status' => 'Aktif', 'avatar' => 'BH', 'actions' => 156],
            ['name' => 'Fitriani Dewi', 'email' => 'fitri.d@pemkab.go.id', 'role' => 'Surveyor', 'status' => 'Aktif', 'avatar' => 'FD', 'actions' => 89],
            ['name' => 'Rahmat Hidayat', 'email' => 'rahmat.h@pemkab.go.id', 'role' => 'Surveyor', 'status' => 'Aktif', 'avatar' => 'RH', 'actions' => 74],
            ['name' => 'Putri Anggraini', 'email' => 'putri.a@pemkab.go.id', 'role' => 'Verifier', 'status' => 'Nonaktif', 'avatar' => 'PA', 'actions' => 45],
            ['name' => 'Yusuf Hakim', 'email' => 'yusuf.h@pemkab.go.id', 'role' => 'Surveyor', 'status' => 'Aktif', 'avatar' => 'YH', 'actions' => 62],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                array_merge($user, ['password' => Hash::make('password')])
            );
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
            Category::updateOrCreate(['code' => $category['code']], $category);
        }

        // 4. Businesses (OSS structure + 10 Indicators)
        $businesses = [
            [
                'id_proyek' => 'PRJ-001',
                'nib' => '220512345678',
                'nama_perusahaan' => 'Toko Maju Bersama',
                'uraian_risiko_proyek' => 'Rendah',
                'kbli' => '47111',
                'judul_kbli' => 'Perdagangan Umum',
                'alamat_usaha' => 'Jl. Merdeka No 1',
                'kecamatan_usaha' => 'Kecamatan Pusat',
                'kelurahan_usaha' => 'Desa A',
                'uraian_status_penanaman_modal' => 'PMDN',
                'status' => 'Aktif',
                'tanggal_terbit_oss' => '2025-01-12',
                'latitude' => -0.5020,
                'longitude' => 117.1530,
                'color' => '#2E7D32',
                'indicator_1' => 'Pajak Terverifikasi',
                'indicator_2' => 'PBG-2025-001',
                'indicator_3' => 'PBB Lunas',
            ],
            [
                'id_proyek' => 'PRJ-002',
                'nib' => '220598765432',
                'nama_perusahaan' => 'CV. Sukses Jaya',
                'uraian_risiko_proyek' => 'Menengah Rendah',
                'kbli' => '96200',
                'judul_kbli' => 'Jasa & Layanan',
                'alamat_usaha' => 'Jl. Sudirman No 4',
                'kecamatan_usaha' => 'Kecamatan Utara',
                'kelurahan_usaha' => 'Desa B',
                'uraian_status_penanaman_modal' => 'PMDN',
                'status' => 'Aktif',
                'tanggal_terbit_oss' => '2025-01-15',
                'latitude' => -0.4950,
                'longitude' => 117.1400,
                'color' => '#2E7D32',
                'indicator_1' => 'Pajak Dalam Proses',
            ],
            [
                'id_proyek' => 'PRJ-003',
                'nib' => '220534521098',
                'nama_perusahaan' => 'Warung Makan Bu Sri',
                'uraian_risiko_proyek' => 'Rendah',
                'kbli' => '56101',
                'judul_kbli' => 'Kuliner & F&B',
                'alamat_usaha' => 'Jl. Thamrin No 9',
                'kecamatan_usaha' => 'Kecamatan Barat',
                'kelurahan_usaha' => 'Desa C',
                'uraian_status_penanaman_modal' => 'PMDN',
                'status' => 'Pending',
                'tanggal_terbit_oss' => '2025-01-18',
                'latitude' => -0.5100,
                'longitude' => 117.1500,
                'color' => '#F57F17',
            ],
            [
                'id_proyek' => 'PRJ-004',
                'nib' => '220511223344',
                'nama_perusahaan' => 'UD. Karya Mandiri',
                'uraian_risiko_proyek' => 'Menengah Tinggi',
                'kbli' => '10799',
                'judul_kbli' => 'Industri Kecil',
                'alamat_usaha' => 'Jl. Gatot Subroto',
                'kecamatan_usaha' => 'Kecamatan Timur',
                'kelurahan_usaha' => 'Desa D',
                'uraian_status_penanaman_modal' => 'PMDN',
                'status' => 'Kadaluarsa',
                'tanggal_terbit_oss' => '2025-01-20',
                'latitude' => -0.5050,
                'longitude' => 117.1600,
                'color' => '#E65100',
            ],
            [
                'id_proyek' => 'PRJ-005',
                'nib' => '220555667788',
                'nama_perusahaan' => 'PT. Mitra Sentosa',
                'uraian_risiko_proyek' => 'Tinggi',
                'kbli' => '46900',
                'judul_kbli' => 'Perdagangan Umum',
                'alamat_usaha' => 'Jl. Asia Afrika',
                'kecamatan_usaha' => 'Kecamatan Selatan',
                'kelurahan_usaha' => 'Desa E',
                'uraian_status_penanaman_modal' => 'PMA',
                'status' => 'Aktif',
                'tanggal_terbit_oss' => '2025-01-22',
                'latitude' => -0.4900,
                'longitude' => 117.1650,
                'color' => '#2E7D32',
                'indicator_1' => 'Pajak Daerah Aktif',
                'indicator_2' => 'PBG-PMA-2024',
                'indicator_4' => 'AMDAL Disetujui',
            ],
        ];

        foreach ($businesses as $business) {
            Business::updateOrCreate(
                ['nib' => $business['nib']],
                $business
            );
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

        // 6. Public Map Access Logs (Rekapitulasi Akses Peta PB)
        $accessLogs = [
            ['nama' => 'Budi Santoso', 'instansi' => 'DPMPTSP', 'accessed_at' => now()->subMinutes(12), 'ip_address' => '127.0.0.1'],
            ['nama' => 'Andi', 'instansi' => 'BAPENDA', 'accessed_at' => now()->subMinutes(25), 'ip_address' => '127.0.0.1'],
            ['nama' => 'Siti Aminah', 'instansi' => 'Dinas PUPR', 'accessed_at' => now()->subHours(2), 'ip_address' => '192.168.1.15'],
            ['nama' => 'Hendra Pratama', 'instansi' => 'Konsultan Perizinan', 'accessed_at' => now()->subHours(4), 'ip_address' => '192.168.1.20'],
            ['nama' => 'Dewi Lestari', 'instansi' => 'Masyarakat Umum', 'accessed_at' => now()->subDay(), 'ip_address' => '114.125.45.10'],
            ['nama' => 'Ahmad Fauzi', 'instansi' => 'BAPPEDA', 'accessed_at' => now()->subDays(2), 'ip_address' => '180.252.12.8'],
        ];

        foreach ($accessLogs as $log) {
            $createdLog = PublicMapAccessLog::create($log);

            // Seed feedback for selected logs to demonstrate admin preview
            if ($createdLog->nama === 'Budi Santoso') {
                PublicMapFeedback::create([
                    'public_map_access_log_id' => $createdLog->id,
                    'rating' => 'happy',
                    'feedback' => 'Peta WebGIS sangat interaktif, filter kecamatan dan status risiko sangat membantu percepatan perizinan.',
                ]);
            } elseif ($createdLog->nama === 'Siti Aminah') {
                PublicMapFeedback::create([
                    'public_map_access_log_id' => $createdLog->id,
                    'rating' => 'neutral',
                    'feedback' => 'Data koordinat beberapa titik sudah tepat, namun mohon diperbanyak layer batas kelurahan.',
                ]);
            } elseif ($createdLog->nama === 'Hendra Pratama') {
                PublicMapFeedback::create([
                    'public_map_access_log_id' => $createdLog->id,
                    'rating' => 'sad',
                    'feedback' => 'Informasi kontak pelaku usaha beberapa belum lengkap di popup.',
                ]);
            }
        }

        // 7. Business Indicators (Data Indikator Per Usaha)
        $majuBersama = Business::where('nib', '220512345678')->first();
        if ($majuBersama) {
            BusinessIndicator::updateOrCreate(
                ['business_id' => $majuBersama->id, 'judul' => 'NPWP'],
                ['nilai' => '12.345.678.9-012.000', 'sort_order' => 1]
            );
            BusinessIndicator::updateOrCreate(
                ['business_id' => $majuBersama->id, 'judul' => 'Status Pajak'],
                ['nilai' => 'Aktif', 'sort_order' => 2]
            );
        }

        $mitraSentosa = Business::where('nib', '220555667788')->first();
        if ($mitraSentosa) {
            BusinessIndicator::updateOrCreate(
                ['business_id' => $mitraSentosa->id, 'judul' => 'Nomor PBG'],
                ['nilai' => 'PBG-2026-001', 'sort_order' => 1]
            );
            BusinessIndicator::updateOrCreate(
                ['business_id' => $mitraSentosa->id, 'judul' => 'Keterangan'],
                ['nilai' => 'Sudah dilakukan verifikasi lapangan.', 'sort_order' => 2]
            );
        }
    }
}
