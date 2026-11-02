<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\PublicMapAccessLog;
use App\Models\PublicMapServiceSurvey;
use App\Models\PublicMapServiceSurveyResponse;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BusinessDownloadFlowTest extends TestCase
{
    protected User $admin;
    protected User $inactiveAdmin;
    protected Business $business;
    protected PublicMapAccessLog $accessLog;

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
            $table->string('role')->default('Administrator');
            $table->string('status')->default('Aktif');
            $table->string('avatar')->nullable();
            $table->integer('actions')->default(0);
            $table->text('settings')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->string('id_proyek')->nullable();
            $table->string('nib')->nullable();
            $table->string('nama_perusahaan');
            $table->string('nama_proyek')->nullable();
            $table->string('uraian_jenis_proyek')->nullable();
            $table->date('tanggal_terbit_oss')->nullable();
            $table->string('day_of_tanggal_pengajuan_proyek')->nullable();
            $table->string('kbli')->nullable();
            $table->string('judul_kbli')->nullable();
            $table->string('kl_sektor_pembina')->nullable();
            $table->string('uraian_jenis_perusahaan')->nullable();
            $table->string('uraian_status_penanaman_modal')->nullable();
            $table->string('uraian_risiko_proyek')->nullable();
            $table->string('uraian_skala_usaha')->nullable();
            $table->text('alamat_usaha')->nullable();
            $table->string('kab_kota_usaha')->nullable();
            $table->string('kecamatan_usaha')->nullable();
            $table->string('kelurahan_usaha')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->decimal('luas_tanah', 15, 2)->nullable();
            $table->string('satuan_tanah')->nullable();
            $table->decimal('jumlah_investasi', 15, 2)->nullable();
            $table->integer('tki')->nullable();
            $table->string('nama_user')->nullable();
            $table->string('email')->nullable();
            $table->string('nomor_telp')->nullable();
            $table->string('status')->default('Aktif');
            $table->timestamps();
        });

        Schema::create('business_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id');
            $table->string('judul')->nullable();
            $table->string('nilai')->nullable();
            $table->integer('sort_order')->default(1);
            $table->timestamps();
        });

        Schema::create('public_map_access_logs', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('instansi');
            $table->string('nik')->nullable();
            $table->string('jenis_kelamin')->nullable();
            $table->timestamp('accessed_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('public_map_service_surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('public_map_access_log_id');
            $table->foreignId('business_id');
            $table->unsignedInteger('total_score')->default(0);
            $table->decimal('average_score', 4, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('public_map_service_survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id');
            $table->foreignId('public_map_access_log_id');
            $table->foreignId('business_id');
            $table->string('indicator_key', 50);
            $table->string('indicator_name', 150);
            $table->text('question');
            $table->string('answer_label', 100);
            $table->unsignedTinyInteger('score');
            $table->timestamps();
        });

        $this->admin = User::create([
            'name'     => 'Super Administrator',
            'email'    => 'admin@samarindakota.go.id',
            'password' => Hash::make('Secret123!'),
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);

        $this->inactiveAdmin = User::create([
            'name'     => 'Inactive Admin',
            'email'    => 'inactive@samarindakota.go.id',
            'password' => Hash::make('Secret123!'),
            'role'     => 'Administrator',
            'status'   => 'Nonaktif',
        ]);

        $this->business = Business::create([
            'nama_perusahaan'       => 'PT Mahakam Borneo Sejahtera',
            'nib'                   => '9120001234567',
            'judul_kbli'            => 'Industri Pengolahan Kayu',
            'uraian_risiko_proyek'  => 'Menengah Rendah',
            'kecamatan_usaha'       => 'Sungai Kunjang',
            'kelurahan_usaha'       => 'Loa Bakung',
            'latitude'              => -0.5021234,
            'longitude'             => 117.1534567,
            'status'                => 'Aktif',
        ]);

        $this->accessLog = PublicMapAccessLog::create([
            'nama'          => 'Budi Santoso',
            'instansi'      => 'DPMPTSP Samarinda',
            'nik'           => '6472010101900001',
            'jenis_kelamin' => 'Laki-laki',
            'accessed_at'   => now(),
        ]);
    }

    /**
     * Skenario 1 - Map Public: Pengunjung belum mengisi survei ditolak dengan 403 requires_survey: true.
     */
    public function test_public_download_without_survey_is_rejected_with_403()
    {
        // 1. Without access_log_id
        $response = $this->getJson("/api/businesses/{$this->business->id}/download");
        $response->assertStatus(403);
        $response->assertJson([
            'status'          => 'error',
            'requires_survey' => true,
        ]);

        // 2. With access_log_id but no survey completed yet
        $responseWithLog = $this->getJson("/api/businesses/{$this->business->id}/download?access_log_id={$this->accessLog->id}");
        $responseWithLog->assertStatus(403);
        $responseWithLog->assertJson([
            'status'          => 'error',
            'requires_survey' => true,
        ]);
    }

    /**
     * Skenario 1 - Map Public: Setelah mengisi survei SKM, pengunduhan PDF berhasil.
     */
    public function test_public_download_succeeds_after_completing_skm_survey()
    {
        // 1. Fill all 9 SKM survey indicators
        $surveyPayload = [
            'access_log_id' => $this->accessLog->id,
            'business_id'   => $this->business->id,
            'answers'       => [
                'persyaratan' => ['answer' => 'Sangat Sesuai', 'score' => 4],
                'prosedur'    => ['answer' => 'Mudah', 'score' => 3],
                'waktu'       => ['answer' => 'Sangat Cepat', 'score' => 4],
                'biaya'       => ['answer' => 'Sangat Wajar', 'score' => 4],
                'produk'      => ['answer' => 'Sangat Sesuai', 'score' => 4],
                'kompetensi'  => ['answer' => 'Kompeten', 'score' => 3],
                'perilaku'    => ['answer' => 'Sangat Sopan dan Ramah', 'score' => 4],
                'pengaduan'   => ['answer' => 'Dikelola dengan Baik', 'score' => 3],
                'sarana'      => ['answer' => 'Sangat Baik', 'score' => 4],
            ],
        ];

        $surveyRes = $this->postJson('/api/public-map-survey', $surveyPayload);
        $this->assertTrue(in_array($surveyRes->status(), [200, 201]));
        $surveyId = $surveyRes->json('data.survey_id');
        $this->assertNotNull($surveyId);

        // 2. Download PDF with access_log_id and survey_id
        $downloadRes = $this->get("/api/businesses/{$this->business->id}/download?access_log_id={$this->accessLog->id}&survey_id={$surveyId}");
        $downloadRes->assertStatus(200);
        $downloadRes->assertHeader('content-type', 'application/pdf');
    }

    /**
     * Skenario 2 - Dashboard Admin: Pengguna publik tanpa autentikasi dilarang mengakses endpoint download admin.
     */
    public function test_unauthenticated_user_cannot_access_admin_download_endpoint()
    {
        $response = $this->get("/api/admin/businesses/{$this->business->id}/download");
        // Must be rejected by auth middleware
        $this->assertTrue(in_array($response->status(), [302, 401]));
    }

    /**
     * Skenario 2 - Dashboard Admin: Akun admin nonaktif dilarang mengunduh via endpoint admin.
     */
    public function test_inactive_admin_cannot_download_via_admin_endpoint()
    {
        $response = $this->actingAs($this->inactiveAdmin)->get("/api/admin/businesses/{$this->business->id}/download");
        $response->assertStatus(403);
    }

    /**
     * Skenario 2 - Dashboard Admin: Admin aktif dapat mengunduh langsung tanpa mengisi survei.
     */
    public function test_active_admin_can_download_directly_without_survey()
    {
        $initialSurveyCount = PublicMapServiceSurvey::count();

        // Admin downloads directly via admin route
        $response = $this->actingAs($this->admin)->get("/api/admin/businesses/{$this->business->id}/download");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');

        // Verify that NO survey record was generated
        $this->assertEquals($initialSurveyCount, PublicMapServiceSurvey::count());
    }

    /**
     * Skenario 2 - Dashboard Admin: Admin aktif juga diizinkan mengunduh langsung via public endpoint tanpa survei.
     */
    public function test_active_admin_can_download_via_public_endpoint_without_survey()
    {
        $initialSurveyCount = PublicMapServiceSurvey::count();

        // Acting as admin calling public download route without access_log_id
        $response = $this->actingAs($this->admin)->get("/api/businesses/{$this->business->id}/download");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');

        // Verify that NO survey record was generated
        $this->assertEquals($initialSurveyCount, PublicMapServiceSurvey::count());
    }
}
