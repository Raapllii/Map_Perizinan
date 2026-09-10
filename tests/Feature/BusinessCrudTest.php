<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BusinessCrudTest extends TestCase
{
    use RefreshDatabase;
    
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->user = User::factory()->create(['role' => 'Administrator']);
    }

    public function test_can_create_business_with_all_27_fields()
    {
        $payload = [
            'id_proyek' => 'PRJ-123',
            'nib' => '1122334455667',
            'nama_perusahaan' => 'PT XYZ Testing',
            'nama_proyek' => 'Proyek A',
            'uraian_jenis_proyek' => 'Utama',
            'tanggal_terbit_oss' => '2023-01-01',
            'day_of_tanggal_pengajuan_proyek' => 'Senin, 01 Januari 2023',
            'kbli' => '47111',
            'judul_kbli' => 'Perdagangan Eceran',
            'kl_sektor_pembina' => 'Kementerian Perdagangan',
            'uraian_jenis_perusahaan' => 'PMDN',
            'uraian_status_penanaman_modal' => 'PMDN',
            'uraian_risiko_proyek' => 'Rendah',
            'uraian_skala_usaha' => 'Mikro',
            'alamat_usaha' => 'Jl. Test No. 1',
            'kab_kota_usaha' => 'Samarinda',
            'kecamatan_usaha' => 'Samarinda Kota',
            'kelurahan_usaha' => 'Pelabuhan',
            'latitude' => -0.501,
            'longitude' => 117.152,
            'luas_tanah' => 1000.50,
            'satuan_tanah' => 'm2',
            'jumlah_investasi' => 50000000,
            'tki' => 5,
            'nama_user' => 'John Doe',
            'email' => 'johndoe@example.com',
            'nomor_telp' => '081234567890',
            'status' => 'Aktif',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/admin/businesses', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('businesses', [
            'nib' => '1122334455667',
            'id_proyek' => 'PRJ-123',
            'uraian_skala_usaha' => 'Mikro',
            'luas_tanah' => 1000.50,
            'tki' => 5
        ]);
    }

    public function test_can_update_business_with_nullable_fields()
    {
        $business = Business::create([
            'nib' => '0011223344556',
            'nama_perusahaan' => 'PT Awal',
            'tki' => 10,
            'jumlah_investasi' => 100000,
        ]);

        // Update with nulls
        $payload = [
            'nama_perusahaan' => 'PT Berubah',
            'tki' => null,
            'jumlah_investasi' => null,
            'alamat_usaha' => 'Jl. Baru'
        ];

        $response = $this->actingAs($this->user)->putJson("/api/admin/businesses/{$business->id}", $payload);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'nama_perusahaan' => 'PT Berubah',
            'tki' => null,
            'jumlah_investasi' => null,
            'alamat_usaha' => 'Jl. Baru'
        ]);
    }
}
