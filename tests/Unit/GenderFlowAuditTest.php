<?php

namespace Tests\Unit;

use App\Exports\RekapitulasiAksesExport;
use App\Exports\RekapitulasiPerizinanExport;
use App\Models\Business;
use App\Models\PublicMapAccessLog;
use App\Models\User;
use App\Services\DashboardService;
use App\Services\RecaptchaService;
use App\Support\GenderNormalizer;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class GenderFlowAuditTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('database.default', 'sqlite');
        Config::set('database.connections.sqlite', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('Super Admin');
            $table->string('status')->default('Aktif');
            $table->timestamps();
        });

        Schema::create('public_map_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('token_hash', 64)->unique();
            $table->string('verified_nik', 16);
            $table->string('verified_name');
            $table->string('verified_gender', 32)->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });

        Schema::create('public_map_access_logs', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('instansi');
            $table->string('nik', 16)->nullable();
            $table->string('jenis_kelamin', 32)->nullable();
            $table->timestamp('accessed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('public_map_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('public_map_access_log_id')->nullable();
            $table->unsignedBigInteger('business_id')->nullable();
            $table->string('rating')->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();
        });

        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->string('nib')->nullable();
            $table->string('nama_perusahaan')->nullable();
            $table->string('nama_user')->nullable();
            $table->string('nama_proyek')->nullable();
            $table->string('kbli')->nullable();
            $table->string('judul_kbli')->nullable();
            $table->string('uraian_skala_usaha')->nullable();
            $table->string('uraian_risiko_proyek')->nullable();
            $table->string('status')->default('Aktif');
            $table->string('kecamatan_usaha')->nullable();
            $table->string('kelurahan_usaha')->nullable();
            $table->decimal('latitude', 12, 8)->nullable();
            $table->decimal('longitude', 12, 8)->nullable();
            $table->date('day_of_tanggal_pengajuan_proyek')->nullable();
            $table->date('tanggal_terbit_oss')->nullable();
            $table->timestamps();
        });

        Schema::create('business_indicators', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('business_id');
            $table->string('judul');
            $table->text('nilai')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        config([
            'recaptcha.site_key'          => RecaptchaService::GOOGLE_TEST_SITE,
            'recaptcha.secret_key'        => RecaptchaService::GOOGLE_TEST_SECRET,
            'recaptcha.allowed_hostnames' => ['localhost', '127.0.0.1', 'testkey.google.com'],
            'recaptcha.verify_url'        => 'https://www.google.com/recaptcha/api/siteverify',
            'recaptcha.timeout'           => 5,
            'dukcapil.enabled'            => true,
            'dukcapil.simulation_enabled' => false,
            'dukcapil.endpoint'           => 'https://api.dukcapil.fake/verify',
            'dukcapil.api_key'            => 'test-official-key',
        ]);

        Cache::flush();
    }

    /**
     * Helper to simulate a full visitor NIK verification + access log flow with a mocked Dukcapil payload.
     */
    private function verifyAndLogVisitor(string $nik, string $nama, ?string $apiGender, string $instansi = 'DPMPTSP'): array
    {
        Http::swap(new \Illuminate\Http\Client\Factory());
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success'  => true,
                'hostname' => 'testkey.google.com',
            ], 200),
            'https://api.dukcapil.fake/verify' => Http::response([
                'status'  => 'success',
                'success' => true,
                'data'    => [
                    'NIK'           => $nik,
                    'NAMA_LGKP'     => $nama,
                    'jenis_kelamin' => $apiGender,
                    'TMPT_LHR'      => 'Banjarbaru',
                    'TGL_LHR'       => '1992-05-15',
                ],
            ], 200),
        ]);

        $verifyRes = $this->postJson('/api/verify-nik', [
            'nik'             => $nik,
            'recaptcha_token' => 'captcha-' . uniqid(),
        ]);
        $verifyRes->assertStatus(200);

        $token = $verifyRes->json('data.verification_token');
        $this->assertNotEmpty($token);

        $accessRes = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => $nama,
            'instansi'           => $instansi,
        ]);
        $accessRes->assertStatus(201);

        return [
            'verify' => $verifyRes->json(),
            'access' => $accessRes->json(),
        ];
    }

    /**
     * Mandatory Test 1: API mengembalikan jenis_kelamin: "Laki-laki" -> tercatat sebagai Laki-laki.
     */
    public function test_api_returning_laki_laki_is_stored_and_counted_as_laki_laki()
    {
        // Note: digits 7-8 are 55 (which would be female if guessed from NIK!), proving API jenis_kelamin is authoritative
        $this->verifyAndLogVisitor('6372015505920001', 'Ahmad Fauzi', 'Laki-laki');

        $this->assertDatabaseHas('public_map_verifications', [
            'verified_nik'    => '6372015505920001',
            'verified_gender' => 'Laki-laki',
        ]);

        $this->assertDatabaseHas('public_map_access_logs', [
            'nik'           => '6372015505920001',
            'nama'          => 'Ahmad Fauzi',
            'jenis_kelamin' => 'Laki-laki',
        ]);

        $recap = GenderNormalizer::aggregateForAccessLogsQuery(PublicMapAccessLog::query());
        $this->assertSame(1, $recap['laki_laki']);
        $this->assertSame(0, $recap['perempuan']);
        $this->assertSame(0, $recap['tidak_diketahui']);
        $this->assertSame(100.0, $recap['persentase_laki_valid']);
    }

    /**
     * Mandatory Test 2: API mengembalikan jenis_kelamin: "Perempuan" -> tercatat sebagai Perempuan.
     */
    public function test_api_returning_perempuan_is_stored_and_counted_as_perempuan()
    {
        // Note: digits 7-8 are 15 (which would be male if guessed from NIK!), proving API jenis_kelamin is authoritative
        $this->verifyAndLogVisitor('6372011505920002', 'Siti Rahmawati', 'Perempuan');

        $this->assertDatabaseHas('public_map_verifications', [
            'verified_nik'    => '6372011505920002',
            'verified_gender' => 'Perempuan',
        ]);

        $this->assertDatabaseHas('public_map_access_logs', [
            'nik'           => '6372011505920002',
            'nama'          => 'Siti Rahmawati',
            'jenis_kelamin' => 'Perempuan',
        ]);

        $recap = GenderNormalizer::aggregateForAccessLogsQuery(PublicMapAccessLog::query());
        $this->assertSame(0, $recap['laki_laki']);
        $this->assertSame(1, $recap['perempuan']);
        $this->assertSame(0, $recap['tidak_diketahui']);
        $this->assertSame(100.0, $recap['persentase_perempuan_valid']);
    }

    /**
     * Mandatory Test 3: API mengembalikan variasi seperti L, P, Male, Female (serta LK, Pria, M, PR, Wanita, F) -> kategori benar.
     */
    public function test_gender_variations_are_normalized_and_recorded_accurately()
    {
        $maleVariants = ['Laki-laki', 'laki-laki', 'L', 'LK', 'Pria', 'Male', 'M'];
        foreach ($maleVariants as $variant) {
            $this->assertSame(
                GenderNormalizer::MALE,
                GenderNormalizer::normalize($variant),
                "Failed normalizing male variant: {$variant}"
            );
        }

        $femaleVariants = ['Perempuan', 'P', 'PR', 'Wanita', 'Female', 'F'];
        foreach ($femaleVariants as $variant) {
            $this->assertSame(
                GenderNormalizer::FEMALE,
                GenderNormalizer::normalize($variant),
                "Failed normalizing female variant: {$variant}"
            );
        }

        // End-to-end verification with API returning L, P, Male, Female
        $this->verifyAndLogVisitor('6372010000000011', 'Visitor L', 'L');
        $this->verifyAndLogVisitor('6372010000000012', 'Visitor Male', 'Male');
        $this->verifyAndLogVisitor('6372010000000013', 'Visitor P', 'P');
        $this->verifyAndLogVisitor('6372010000000014', 'Visitor Female', 'Female');

        $this->assertDatabaseHas('public_map_access_logs', ['nik' => '6372010000000011', 'jenis_kelamin' => 'Laki-laki']);
        $this->assertDatabaseHas('public_map_access_logs', ['nik' => '6372010000000012', 'jenis_kelamin' => 'Laki-laki']);
        $this->assertDatabaseHas('public_map_access_logs', ['nik' => '6372010000000013', 'jenis_kelamin' => 'Perempuan']);
        $this->assertDatabaseHas('public_map_access_logs', ['nik' => '6372010000000014', 'jenis_kelamin' => 'Perempuan']);

        $recap = GenderNormalizer::aggregateForAccessLogsQuery(PublicMapAccessLog::query());
        $this->assertSame(2, $recap['laki_laki']);
        $this->assertSame(2, $recap['perempuan']);
        $this->assertSame(0, $recap['tidak_diketahui']);
        $this->assertSame(4, $recap['total_valid']);
        $this->assertSame(50.0, $recap['persentase_laki_valid']);
        $this->assertSame(50.0, $recap['persentase_perempuan_valid']);
    }

    /**
     * Mandatory Test 4: Gender kosong atau tidak dikenal -> Tidak Diketahui (tidak menebak dari digit NIK maupun nama).
     */
    public function test_empty_or_unrecognized_gender_is_recorded_as_tidak_diketahui()
    {
        foreach ([null, '', '   ', '-', 'null', 'n/a', 'Unknown', 'Lainnya', 'X'] as $invalid) {
            $this->assertSame(GenderNormalizer::UNKNOWN, GenderNormalizer::normalize($invalid));
            $this->assertSame(GenderNormalizer::UNKNOWN, GenderNormalizer::fromNikOrField('6372011505920001', $invalid));
        }

        // Valid 16-digit NIKs with birth date digits 15 and 55, but API returns empty or unknown gender
        $this->verifyAndLogVisitor('6372011505920021', 'Budi Tanpa Gender', '');
        $this->verifyAndLogVisitor('6372015505920022', 'Ani Gender Unknown', 'Tidak Dikenal');
        $this->verifyAndLogVisitor('6372012005920023', 'Citra Gender Null', null);

        $this->assertDatabaseHas('public_map_access_logs', ['nik' => '6372011505920021', 'jenis_kelamin' => 'Tidak Diketahui']);
        $this->assertDatabaseHas('public_map_access_logs', ['nik' => '6372015505920022', 'jenis_kelamin' => 'Tidak Diketahui']);
        $this->assertDatabaseHas('public_map_access_logs', ['nik' => '6372012005920023', 'jenis_kelamin' => 'Tidak Diketahui']);

        $recap = GenderNormalizer::aggregateForAccessLogsQuery(PublicMapAccessLog::query());
        $this->assertSame(0, $recap['laki_laki']);
        $this->assertSame(0, $recap['perempuan']);
        $this->assertSame(3, $recap['tidak_diketahui']);
        $this->assertSame(0, $recap['total_valid']);
        $this->assertSame(3, $recap['total']);
    }

    /**
     * Mandatory Test 5: Data yang sama tidak dihitung dua kali & kelompok data pengunjung tidak tercampur dengan pemilik usaha.
     */
    public function test_same_visitor_or_business_is_never_counted_twice_and_groups_are_not_mixed()
    {
        // 1. Same visitor accesses Public Map 3 times using 3 single-use tokens
        $this->verifyAndLogVisitor('6372011505920031', 'Rudi Hartono', 'Laki-laki', 'Dinas A');
        $this->verifyAndLogVisitor('6372011505920031', 'Rudi Hartono', 'Laki-laki', 'Dinas A');
        $this->verifyAndLogVisitor('6372011505920031', 'Rudi Hartono', 'L', 'Dinas A');

        // Another unique female visitor accesses twice
        $this->verifyAndLogVisitor('6372015505920032', 'Dewi Sartika', 'Perempuan', 'Dinas B');
        $this->verifyAndLogVisitor('6372015505920032', 'Dewi Sartika', 'Female', 'Dinas B');

        // Total raw log rows = 5, but unique visitors = 2 (1 Laki-laki, 1 Perempuan)
        $this->assertDatabaseCount('public_map_access_logs', 5);

        $visitorRecap = GenderNormalizer::aggregateForAccessLogsQuery(PublicMapAccessLog::query());
        $this->assertSame(1, $visitorRecap['laki_laki']);
        $this->assertSame(1, $visitorRecap['perempuan']);
        $this->assertSame(0, $visitorRecap['tidak_diketahui']);
        $this->assertSame(2, $visitorRecap['total']);

        // 2. Businesses dataset with multiple indicators for the same business
        $b1 = Business::create([
            'nib'                  => '1234567890001',
            'nama_perusahaan'      => 'PT Maju Bersama',
            'nama_user'            => 'Hendra Wijaya',
            'uraian_risiko_proyek' => 'Rendah',
            'status'               => 'Aktif',
            'tanggal_terbit_oss'   => '2026-03-10',
        ]);
        // Insert 3 gender indicators for the SAME business $b1 -> must only be counted ONCE
        DB::table('business_indicators')->insert([
            ['business_id' => $b1->id, 'judul' => 'Jenis Kelamin', 'nilai' => 'Laki-laki', 'sort_order' => 1],
            ['business_id' => $b1->id, 'judul' => 'gender', 'nilai' => 'Male', 'sort_order' => 2],
            ['business_id' => $b1->id, 'judul' => 'jenis_kelamin', 'nilai' => 'L', 'sort_order' => 3],
        ]);

        $b2 = Business::create([
            'nib'                  => '1234567890002',
            'nama_perusahaan'      => 'CV Berkah Ibu',
            'nama_user'            => 'Sri Wahyuni',
            'uraian_risiko_proyek' => 'Menengah Rendah',
            'status'               => 'Aktif',
            'tanggal_terbit_oss'   => '2026-03-12',
        ]);
        // No gender indicator for $b2 -> must NOT guess from nama_user "Sri Wahyuni" -> Tidak Diketahui

        $businessRecap = GenderNormalizer::aggregateForBusinessQuery(Business::query());
        $this->assertSame(1, $businessRecap['laki_laki']);
        $this->assertSame(0, $businessRecap['perempuan']);
        $this->assertSame(1, $businessRecap['tidak_diketahui']);
        $this->assertSame(2, $businessRecap['total']);
    }

    /**
     * Mandatory Test 6: Hasil dashboard dan Excel konsisten (baik untuk Rekapitulasi Perizinan Usaha maupun Rekapitulasi Akses Pengunjung).
     */
    public function test_dashboard_and_excel_export_results_are_strictly_consistent()
    {
        // A. Seed Visitor Access Logs
        $this->verifyAndLogVisitor('6372011505920041', 'Andi Pratama', 'Laki-laki', 'DPMPTSP');
        $this->verifyAndLogVisitor('6372011505920041', 'Andi Pratama', 'Laki-laki', 'DPMPTSP'); // duplicate visit
        $this->verifyAndLogVisitor('6372015505920042', 'Bunga Citra', 'Perempuan', 'Dinas Kesehatan');
        $this->verifyAndLogVisitor('6372015505920043', 'Carla Putri', 'Female', 'Dinas Pendidikan');
        $this->verifyAndLogVisitor('6372011505920044', 'Doni Kosong', '', 'Umum');

        $admin = User::create([
            'name'     => 'Admin Test',
            'email'    => 'admin@banjarbaru.go.id',
            'password' => bcrypt('password'),
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);

        $apiRes = $this->actingAs($admin)->getJson('/api/admin/public-map-access-logs');
        $apiRes->assertStatus(200);
        $dashboardVisitorGender = $apiRes->json('meta.gender_recap');

        // Build Excel export for Visitor Access Logs
        $aksesExport = new RekapitulasiAksesExport(PublicMapAccessLog::query());
        $aksesSheets = $aksesExport->sheets();
        $this->assertCount(3, $aksesSheets);

        $ringkasanAksesRows = $aksesSheets[0]->array();
        $genderAksesRows    = $aksesSheets[2]->array();

        // Sheet 1 (Ringkasan Rekapitulasi) rows:
        // Index 9 = Total Keseluruhan, 10 = Total Valid, 11 = Laki-laki, 12 = Perempuan, 13 = Tidak Diketahui
        $this->assertSame($dashboardVisitorGender['total'], $ringkasanAksesRows[9][1]);
        $this->assertSame($dashboardVisitorGender['total_valid'], $ringkasanAksesRows[10][1]);
        $this->assertSame($dashboardVisitorGender['laki_laki'], $ringkasanAksesRows[11][1]);
        $this->assertSame($dashboardVisitorGender['perempuan'], $ringkasanAksesRows[12][1]);
        $this->assertSame($dashboardVisitorGender['tidak_diketahui'], $ringkasanAksesRows[13][1]);

        // Sheet 3 (Rekapitulasi Gender) rows:
        // Index 7 = Laki-laki, 8 = Perempuan, 9 = Tidak Diketahui, 10 = Total Valid, 11 = Total Keseluruhan
        $this->assertSame($dashboardVisitorGender['laki_laki'], $genderAksesRows[7][2]);
        $this->assertSame($dashboardVisitorGender['perempuan'], $genderAksesRows[8][2]);
        $this->assertSame($dashboardVisitorGender['tidak_diketahui'], $genderAksesRows[9][2]);
        $this->assertSame($dashboardVisitorGender['total_valid'], $genderAksesRows[10][2]);
        $this->assertSame($dashboardVisitorGender['total'], $genderAksesRows[11][2]);

        // B. Seed Business Records & compare DashboardService::getGenderData() with RekapitulasiPerizinanExport
        $biz1 = Business::create(['nib' => '9001', 'nama_perusahaan' => 'Usaha 1', 'status' => 'Aktif', 'uraian_risiko_proyek' => 'Rendah', 'tanggal_terbit_oss' => '2026-01-10']);
        $biz2 = Business::create(['nib' => '9002', 'nama_perusahaan' => 'Usaha 2', 'status' => 'Aktif', 'uraian_risiko_proyek' => 'Menengah Rendah', 'tanggal_terbit_oss' => '2026-01-11']);
        $biz3 = Business::create(['nib' => '9003', 'nama_perusahaan' => 'Usaha 3', 'status' => 'Aktif', 'uraian_risiko_proyek' => 'Tinggi', 'tanggal_terbit_oss' => '2026-01-12']);

        DB::table('business_indicators')->insert([
            ['business_id' => $biz1->id, 'judul' => 'jenis_kelamin', 'nilai' => 'LK', 'sort_order' => 1],
            ['business_id' => $biz2->id, 'judul' => 'jenis_kelamin', 'nilai' => 'PR', 'sort_order' => 1],
        ]);

        $dashboardService = app(DashboardService::class);
        $dashboardBizGender = $dashboardService->getGenderData(null);

        $bizExport = new RekapitulasiPerizinanExport(Business::query());
        $bizSheets = $bizExport->sheets();
        $this->assertCount(3, $bizSheets);

        $ringkasanBizRows = $bizSheets[0]->array();
        $detailBizSheet   = $bizSheets[1];
        $genderBizRows    = $bizSheets[2]->array();

        $this->assertSame($dashboardBizGender['total'], $ringkasanBizRows[9][1]);
        $this->assertSame($dashboardBizGender['total_valid'], $ringkasanBizRows[10][1]);
        $this->assertSame($dashboardBizGender['laki_laki'], $ringkasanBizRows[11][1]);
        $this->assertSame($dashboardBizGender['perempuan'], $ringkasanBizRows[12][1]);
        $this->assertSame($dashboardBizGender['tidak_diketahui'], $ringkasanBizRows[13][1]);

        $this->assertSame($dashboardBizGender['laki_laki'], $genderBizRows[7][2]);
        $this->assertSame($dashboardBizGender['perempuan'], $genderBizRows[8][2]);
        $this->assertSame($dashboardBizGender['tidak_diketahui'], $genderBizRows[9][2]);
        $this->assertSame($dashboardBizGender['total_valid'], $genderBizRows[10][2]);
        $this->assertSame($dashboardBizGender['total'], $genderBizRows[11][2]);

        // Verify DetailDataPerizinanSheet maps each business to the exact same normalized gender
        $mapped1 = $detailBizSheet->map($biz1);
        $mapped2 = $detailBizSheet->map($biz2);
        $mapped3 = $detailBizSheet->map($biz3);

        $this->assertSame('Laki-laki', $mapped1[4]);
        $this->assertSame('Perempuan', $mapped2[4]);
        $this->assertSame('Belum Diisi / Tidak Diketahui', $mapped3[4]);
    }
}
