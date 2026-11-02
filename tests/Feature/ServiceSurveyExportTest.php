<?php

namespace Tests\Feature;

use App\Exports\RekapitulasiSurveiExport;
use App\Exports\Sheets\DetailDataSurveiSheet;
use App\Exports\Sheets\RekapitulasiIndikatorSurveiSheet;
use App\Exports\Sheets\RingkasanSurveiSheet;
use App\Http\Controllers\Api\PublicMapServiceSurveyController;
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
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class ServiceSurveyExportTest extends TestCase
{
    protected User $admin;
    protected User $inactiveUser;
    protected Business $business;
    protected PublicMapAccessLog $accessLog;
    protected PublicMapServiceSurvey $survey;

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
            $table->string('nib')->nullable();
            $table->string('nama_perusahaan')->nullable();
            $table->string('status')->default('Aktif');
            $table->string('kecamatan_usaha')->nullable();
            $table->string('uraian_risiko_proyek')->nullable();
            $table->timestamps();
        });

        Schema::create('public_map_access_logs', function (Blueprint $table) {
            $table->id();
            $table->string('nama')->nullable();
            $table->string('instansi')->nullable();
            $table->string('nik', 16)->nullable();
            $table->string('jenis_kelamin')->nullable();
            $table->timestamp('accessed_at')->nullable();
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
            'name' => 'Admin Test',
            'email' => 'admin.test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'Administrator',
            'status' => 'Aktif',
        ]);

        $this->inactiveUser = User::create([
            'name' => 'Inactive User',
            'email' => 'inactive.user@example.com',
            'password' => Hash::make('password123'),
            'role' => 'Administrator',
            'status' => 'Nonaktif',
        ]);

        $this->business = Business::create([
            'nama_perusahaan' => 'PT Mitra Pelayanan Terpadu',
            'nib' => '9120001234567',
            'status' => 'Aktif',
            'kecamatan_usaha' => 'Kecamatan Samarinda Kota',
            'uraian_risiko_proyek' => 'Rendah',
        ]);

        $this->accessLog = PublicMapAccessLog::create([
            'nama' => 'Budi Santoso',
            'instansi' => 'Dinas Pendidikan',
            'nik' => '3201234567890001',
            'jenis_kelamin' => 'Laki-laki',
            'accessed_at' => now(),
        ]);

        $this->survey = PublicMapServiceSurvey::create([
            'public_map_access_log_id' => $this->accessLog->id,
            'business_id' => $this->business->id,
            'total_score' => 36,
            'average_score' => 4.00,
            'created_at' => now(),
        ]);

        $definitions = PublicMapServiceSurveyController::getIndicatorDefinitions();
        foreach ($definitions as $key => $def) {
            PublicMapServiceSurveyResponse::create([
                'survey_id' => $this->survey->id,
                'public_map_access_log_id' => $this->accessLog->id,
                'business_id' => $this->business->id,
                'indicator_key' => $key,
                'indicator_name' => $def['name'],
                'question' => $def['question'],
                'answer_label' => array_key_first($def['options']),
                'score' => 4,
                'created_at' => now(),
            ]);
        }
    }

    public function test_unauthenticated_user_cannot_export_service_surveys()
    {
        $response = $this->get('/api/admin/service-surveys/export');
        $this->assertTrue(in_array($response->status(), [401, 302]));
    }

    public function test_inactive_user_cannot_export_service_surveys()
    {
        $response = $this->actingAs($this->inactiveUser)->get('/api/admin/service-surveys/export');
        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_export_service_surveys_excel_with_all_three_sheets()
    {
        Excel::shouldReceive('download')
            ->once()
            ->withArgs(function ($export, $filename) {
                $this->assertInstanceOf(RekapitulasiSurveiExport::class, $export);
                $this->assertEquals('Rekapitulasi_Survei_Pelayanan_Semua_Periode.xlsx', $filename);

                $sheets = $export->sheets();
                $this->assertCount(3, $sheets, 'Export workbook must contain exactly 3 sheets.');
                $this->assertInstanceOf(RingkasanSurveiSheet::class, $sheets[0]);
                $this->assertInstanceOf(RekapitulasiIndikatorSurveiSheet::class, $sheets[1]);
                $this->assertInstanceOf(DetailDataSurveiSheet::class, $sheets[2]);

                // Test Sheet 1 contents
                $sheet1Data = $sheets[0]->array();
                $this->assertEquals('Ringkasan', $sheets[0]->title());
                $this->assertNotEmpty($sheet1Data);
                $this->assertEquals('REKAPITULASI SURVEI PELAYANAN (9 INDIKATOR KEPUASAN MASYARAKAT)', $sheet1Data[0][0]);

                // Test Sheet 2 contents
                $sheet2Data = $sheets[1]->array();
                $this->assertEquals('Rekapitulasi Indikator', $sheets[1]->title());
                $this->assertNotEmpty($sheet2Data);
                $this->assertEquals('REKAPITULASI NILAI INDEKS KEPUASAN MASYARAKAT (IKM) PER UNSUR PELAYANAN', $sheet2Data[0][0]);

                // Test Sheet 3 headings and title
                $this->assertEquals('Data Survei', $sheets[2]->title());
                $this->assertContains('NIK (Masked)', $sheets[2]->headings());

                return true;
            })
            ->andReturn(response('fake-content', 200, [
                'Content-Disposition' => 'attachment; filename="Rekapitulasi_Survei_Pelayanan_Semua_Periode.xlsx"',
            ]));

        $response = $this->actingAs($this->admin)->get('/api/admin/service-surveys/export');
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="Rekapitulasi_Survei_Pelayanan_Semua_Periode.xlsx"');
    }

    public function test_export_excel_with_year_filter_generates_dynamic_filename()
    {
        Excel::shouldReceive('download')
            ->once()
            ->withArgs(function ($export, $filename) {
                $this->assertEquals('Rekapitulasi_Survei_Pelayanan_2026.xlsx', $filename);
                return true;
            })
            ->andReturn(response('fake-content', 200, [
                'Content-Disposition' => 'attachment; filename="Rekapitulasi_Survei_Pelayanan_2026.xlsx"',
            ]));

        $response = $this->actingAs($this->admin)->get('/api/admin/service-surveys/export?year=2026');
        $response->assertStatus(200);
    }

    public function test_export_excel_with_date_range_filter_generates_dynamic_filename()
    {
        Excel::shouldReceive('download')
            ->once()
            ->withArgs(function ($export, $filename) {
                $this->assertEquals('Rekapitulasi_Survei_Pelayanan_2026-01-01_sd_2026-12-31.xlsx', $filename);
                return true;
            })
            ->andReturn(response('fake-content', 200, [
                'Content-Disposition' => 'attachment; filename="Rekapitulasi_Survei_Pelayanan_2026-01-01_sd_2026-12-31.xlsx"',
            ]));

        $response = $this->actingAs($this->admin)->get('/api/admin/service-surveys/export?start_date=2026-01-01&end_date=2026-12-31');
        $response->assertStatus(200);
    }

    public function test_export_excel_via_dashboard_controller_source_param()
    {
        Excel::shouldReceive('download')
            ->once()
            ->withArgs(function ($export, $filename) {
                $this->assertEquals('Rekapitulasi_Survei_Pelayanan_2026.xlsx', $filename);
                return true;
            })
            ->andReturn(response('fake-content', 200, [
                'Content-Disposition' => 'attachment; filename="Rekapitulasi_Survei_Pelayanan_2026.xlsx"',
            ]));

        $response = $this->actingAs($this->admin)->get('/api/admin/dashboard/export/excel?source=service_surveys&year=2026');
        $response->assertStatus(200);
    }

    public function test_export_excel_masks_nik_and_protects_sensitive_data()
    {
        $responseRecord = PublicMapServiceSurveyResponse::where('survey_id', $this->survey->id)->first();
        $sheet = new DetailDataSurveiSheet(PublicMapServiceSurveyResponse::where('id', $responseRecord->id));
        $mapped = $sheet->map($responseRecord);

        // NIK column is at index 6
        $maskedNik = $mapped[6];
        $this->assertNotEquals('3201234567890001', $maskedNik, 'Raw NIK must not be displayed.');
        $this->assertStringContainsString('*', $maskedNik, 'NIK must be masked with asterisks.');
        $this->assertEquals('320**********001', $maskedNik);
    }

    public function test_export_excel_empty_data_succeeds_gracefully()
    {
        Excel::shouldReceive('download')
            ->once()
            ->withArgs(function ($export, $filename) {
                $this->assertEquals('Rekapitulasi_Survei_Pelayanan_Semua_Periode.xlsx', $filename);
                $this->assertCount(3, $export->sheets());
                return true;
            })
            ->andReturn(response('fake-content', 200, [
                'Content-Disposition' => 'attachment; filename="Rekapitulasi_Survei_Pelayanan_Semua_Periode.xlsx"',
            ]));

        $response = $this->actingAs($this->admin)->get('/api/admin/service-surveys/export?instansi=NonExistentInstansiXYZ');
        $response->assertStatus(200);
    }
}
