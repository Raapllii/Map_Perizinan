<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class CleanDummyDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:clean-dummy-data {--force : Jalankan pembersihan tanpa konfirmasi interaktif}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Membersihkan seluruh data dummy contoh di aplikasi Map Perizinan DPMPTSP dan memastikan akun Super Admin admin@dpmptsp.co.id aktif';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('=== PEMBERSIHAN DATA DUMMY MAP PERIZINAN DPMPTSP ===');

        if (!$this->option('force') && !$this->confirm('Apakah Anda yakin ingin menghapus seluruh data dummy dan menginisialisasi akun admin@dpmptsp.co.id?', true)) {
            $this->warn('Operasi pembersihan dibatalkan.');
            return Command::SUCCESS;
        }

        // 1. Buat Backup snapshot sebelum penghapusan
        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $backupTables = [
            'users',
            'businesses',
            'categories',
            'business_indicators',
            'activity_logs',
            'public_map_access_logs',
            'public_map_feedbacks',
            'public_map_service_surveys',
            'public_map_service_survey_responses',
            'public_map_verifications',
        ];

        $backupData = [
            'backed_up_at' => date('c'),
            'database' => config('database.connections.pgsql.database'),
            'tables' => [],
        ];

        foreach ($backupTables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                $backupData['tables'][$table] = DB::table($table)->get()->map(fn($r) => (array) $r)->toArray();
            }
        }

        $backupFilename = 'backup_pre_cleanup_' . date('Y_m_d_H_i_s') . '.json';
        $backupFullPath = $backupDir . DIRECTORY_SEPARATOR . $backupFilename;
        File::put($backupFullPath, json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $this->info("✓ Snapshot backup database berhasil disimpan di: {$backupFullPath}");

        // 2. Jalankan pembersihan dalam Database Transaction
        DB::beginTransaction();
        try {
            $deletedCounts = [];

            // A. Public Map Service Survey Responses
            if (DB::getSchemaBuilder()->hasTable('public_map_service_survey_responses')) {
                $deletedCounts['public_map_service_survey_responses'] = DB::table('public_map_service_survey_responses')->delete();
            }

            // B. Public Map Service Surveys
            if (DB::getSchemaBuilder()->hasTable('public_map_service_surveys')) {
                $deletedCounts['public_map_service_surveys'] = DB::table('public_map_service_surveys')->delete();
            }

            // C. Public Map Feedbacks
            if (DB::getSchemaBuilder()->hasTable('public_map_feedbacks')) {
                $deletedCounts['public_map_feedbacks'] = DB::table('public_map_feedbacks')->delete();
            }

            // D. Business Indicators
            if (DB::getSchemaBuilder()->hasTable('business_indicators')) {
                $deletedCounts['business_indicators'] = DB::table('business_indicators')->delete();
            }

            // E. Businesses
            if (DB::getSchemaBuilder()->hasTable('businesses')) {
                $deletedCounts['businesses'] = DB::table('businesses')->delete();
            }

            // F. Public Map Access Logs
            if (DB::getSchemaBuilder()->hasTable('public_map_access_logs')) {
                $deletedCounts['public_map_access_logs'] = DB::table('public_map_access_logs')->delete();
            }

            // G. Public Map Verifications
            if (DB::getSchemaBuilder()->hasTable('public_map_verifications')) {
                $deletedCounts['public_map_verifications'] = DB::table('public_map_verifications')->delete();
            }

            // H. Categories (Seeded dummy totals)
            if (DB::getSchemaBuilder()->hasTable('categories')) {
                $deletedCounts['categories'] = DB::table('categories')->delete();
            }

            // I. Activity Logs (Dummy logs)
            if (DB::getSchemaBuilder()->hasTable('activity_logs')) {
                $deletedCounts['activity_logs'] = DB::table('activity_logs')->delete();
            }

            // J. Users: Hapus semua user dummy, kecualikan atau buat akun Super Admin utama
            $dummyEmails = [
                'andi.k@pemkab.go.id',
                'siti.r@pemkab.go.id',
                'budi.h@pemkab.go.id',
                'fitri.d@pemkab.go.id',
                'rahmat.h@pemkab.go.id',
                'putri.a@pemkab.go.id',
                'yusuf.h@pemkab.go.id',
            ];
            $deletedUsers = DB::table('users')->whereIn('email', $dummyEmails)->delete();
            // Juga hapus akun lain selain admin utama yang diminta
            $deletedOtherUsers = DB::table('users')->where('email', '!=', 'admin@dpmptsp.co.id')->delete();
            $deletedCounts['users'] = $deletedUsers + $deletedOtherUsers;

            // K. Inisialisasi Akun Super Admin Utama
            $adminUser = User::updateOrCreate(
                ['email' => 'admin@dpmptsp.co.id'],
                [
                    'name' => 'Super Administrator DPMPTSP',
                    'password' => Hash::make('kotasamarinda'),
                    'role' => 'Super Admin',
                    'status' => 'Aktif',
                    'avatar' => 'SA',
                    'actions' => 0,
                    'settings' => null,
                ]
            );

            // L. Catat aktivitas inisialisasi resmi
            if (DB::getSchemaBuilder()->hasTable('activity_logs')) {
                ActivityLog::create([
                    'time' => date('H:i'),
                    'action' => 'Pembersihan Data Dummy & Inisialisasi Akun',
                    'name' => 'Super Administrator DPMPTSP',
                    'status_type' => 'approved',
                    'user_id' => $adminUser->id,
                    'user_name' => $adminUser->name,
                    'note' => 'Seluruh data dummy dibersihkan; akun utama admin@dpmptsp.co.id aktif sebagai Super Admin.',
                ]);
            }

            DB::commit();

            // 3. Bersihkan Cache Dashboard dan Sistem
            Cache::flush();

            $this->info('✓ Transaksi pembersihan data dummy berhasil di-commit.');
            $this->info('✓ Seluruh cache dashboard dan aplikasi telah dibersihkan.');
            $this->newLine();

            $tableRows = [];
            foreach ($deletedCounts as $tbl => $cnt) {
                $tableRows[] = [$tbl, $cnt . ' baris'];
            }
            $this->table(['Nama Tabel', 'Data Dummy Dihapus'], $tableRows);

            $this->newLine();
            $this->info("AKUN SUPER ADMIN UTAMA:");
            $this->line("  - Nama     : {$adminUser->name}");
            $this->line("  - Email    : {$adminUser->email}");
            $this->line("  - Role     : {$adminUser->role}");
            $this->line("  - Status   : {$adminUser->status}");
            $this->line("  - Password : (Telah di-hash dengan Bcrypt)");

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Gagal membersihkan data dummy: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}

