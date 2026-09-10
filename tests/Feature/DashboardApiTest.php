<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;
    
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        
        $this->user = User::factory()->create();
        
        // Buat dummy data
        Business::create([
            'nama_perusahaan' => 'Test Company A',
            'nib' => '1234567890123',
            'status' => 'Aktif',
            'tanggal_terbit_oss' => '2024-05-15',
            'kecamatan_usaha' => 'Kecamatan Samarinda Kota',
            'uraian_risiko_proyek' => 'Menengah Rendah',
            'latitude' => -0.5,
            'longitude' => 117.1,
            'judul_kbli' => 'Perdagangan Eceran'
        ]);

        Business::create([
            'nama_perusahaan' => 'Test Company B',
            'nib' => '0987654321098',
            'status' => 'Aktif',
            'tanggal_terbit_oss' => '2025-02-10',
            'kecamatan_usaha' => 'Kecamatan Samarinda Kota',
            'uraian_risiko_proyek' => 'Tinggi',
            'latitude' => -0.51,
            'longitude' => 117.11,
            'judul_kbli' => 'Jasa Konsultasi'
        ]);
        
        Business::create([
            'nama_perusahaan' => 'Test Company C',
            'nib' => '0000000000000',
            'status' => 'Aktif',
            'tanggal_terbit_oss' => '2025-03-01',
            'kecamatan_usaha' => 'Kecamatan Samarinda Ulu',
            'uraian_risiko_proyek' => 'Rendah',
            'latitude' => null, // Belum dipetakan
            'longitude' => null,
            'judul_kbli' => 'Perdagangan Eceran'
        ]);
    }

    public function test_dashboard_endpoint_without_year_returns_overall_data()
    {
        // Panggil tanpa tahun (untuk Dashboard overview)
        $response = $this->actingAs($this->user)->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
        
        // Assert json structure yang krusial
        $response->assertJsonStructure([
            'target_year',
            'kpi' => [
                'total',
                'risks',
                'belum_dipetakan'
            ],
            'monthly',
            'distribution',
            'districts',
            'activities',
            'markers'
        ]);

        // Verifikasi Total Usaha (semua tahun = 3)
        $this->assertEquals(3, $response->json('kpi.total.value'));
        
        // Verifikasi Target Year (tahun terbaru dari data = 2025)
        $this->assertEquals('2025', $response->json('target_year'));

        // Verifikasi Kecamatan (DashboardPage.tsx ekspektasi: risiko_rendah, risiko_menengah, risiko_tinggi, TIDAK active)
        $districts = collect($response->json('districts'));
        
        $samarindaKota = $districts->firstWhere('name', 'Kec. Samarinda Kota');
        $this->assertNotNull($samarindaKota);
        $this->assertEquals(2, $samarindaKota['total']);
        $this->assertEquals(0, $samarindaKota['risiko_rendah']);
        $this->assertEquals(1, $samarindaKota['risiko_menengah']);
        $this->assertEquals(1, $samarindaKota['risiko_tinggi']);
        $this->assertArrayNotHasKey('active', $samarindaKota);

        $samarindaUlu = $districts->firstWhere('name', 'Kec. Samarinda Ulu');
        $this->assertNotNull($samarindaUlu);
        $this->assertEquals(1, $samarindaUlu['total']);
        $this->assertEquals(1, $samarindaUlu['risiko_rendah']);

        // Markers harus memiliki latitude & longitude yang valid
        $markers = $response->json('markers');
        $this->assertCount(2, $markers); // Karena Company C null lat/long
    }

    public function test_dashboard_endpoint_with_year_returns_filtered_data_for_laporan()
    {
        // Panggil dengan tahun 2024 (Untuk LaporanPage.tsx)
        $response = $this->actingAs($this->user)->getJson('/api/admin/dashboard?year=2024');

        $response->assertStatus(200);

        // Verifikasi Total Usaha difilter untuk tahun 2024 = 1
        $this->assertEquals(1, $response->json('kpi.total.value'));

        // Verifikasi Target Year tetap mengikuti parameter
        $this->assertEquals('2024', $response->json('target_year'));
        
        $districts = collect($response->json('districts'));
        $samarindaKota = $districts->firstWhere('name', 'Kec. Samarinda Kota');
        
        // Hanya 1 perusahaan di 2024 (Menengah Rendah)
        $this->assertNotNull($samarindaKota);
        $this->assertEquals(1, $samarindaKota['total']);
        $this->assertEquals(1, $samarindaKota['risiko_menengah']);
        
        // Cek change persentase ada karena filter tahun diterapkan
        $this->assertNotNull($response->json('kpi.total.change'));
    }
}
