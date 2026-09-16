<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;
use App\Models\User;
use App\Models\Business;
use App\Models\BusinessIndicator;

class BusinessPerItemIndicatorTest extends TestCase
{
    use DatabaseTransactions;
    protected function getAdminUser()
    {
        return User::firstOrCreate(
            ['email' => 'admin_test@pemkab.go.id'],
            [
                'name' => 'Admin Tester',
                'password' => bcrypt('password'),
                'role' => 'Super Admin',
                'status' => 'Aktif',
            ]
        );
    }

    protected function validBusinessPayload(array $overrides = [])
    {
        return array_merge([
            'nib' => '998877665544',
            'nama_perusahaan' => 'PT Test Indikator Bersama',
            'uraian_jenis_proyek' => 'Utama',
            'status' => 'Aktif',
            'kecamatan_usaha' => 'Kecamatan Pusat',
            'kelurahan_usaha' => 'Kelurahan A',
            'latitude' => -0.5000,
            'longitude' => 117.1500,
        ], $overrides);
    }

    /**
     * TEST 1: Create Business tanpa indikator berhasil.
     */
    public function test_create_business_without_indicators_succeeds()
    {
        $admin = $this->getAdminUser();

        $payload = $this->validBusinessPayload([
            'nib' => 'TEST001_' . uniqid(),
            'nama_perusahaan' => 'PT Tanpa Indikator',
        ]);

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/businesses', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('businesses', ['nama_perusahaan' => 'PT Tanpa Indikator']);
        
        $businessId = $response->json('data.id');
        $this->assertEquals(0, BusinessIndicator::where('business_id', $businessId)->count());
    }

    /**
     * TEST 2: Create Business dengan 1 indikator berhasil.
     */
    public function test_create_business_with_single_indicator_succeeds()
    {
        $admin = $this->getAdminUser();

        $payload = $this->validBusinessPayload([
            'nib' => 'TEST002_' . uniqid(),
            'nama_perusahaan' => 'PT Satu Indikator',
            'indicators' => [
                ['judul' => 'NPWP', 'nilai' => '12.345.678.9-012.000']
            ]
        ]);

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/businesses', $payload);

        $response->assertStatus(201);
        $businessId = $response->json('data.id');

        $this->assertDatabaseHas('business_indicators', [
            'business_id' => $businessId,
            'judul' => 'NPWP',
            'nilai' => '12.345.678.9-012.000',
        ]);
        $this->assertCount(1, $response->json('data.indicators'));
    }

    /**
     * TEST 3: Create Business dengan beberapa indikator berhasil.
     */
    public function test_create_business_with_multiple_indicators_succeeds()
    {
        $admin = $this->getAdminUser();

        $payload = $this->validBusinessPayload([
            'nib' => 'TEST003_' . uniqid(),
            'nama_perusahaan' => 'PT Multi Indikator',
            'indicators' => [
                ['judul' => 'NPWP', 'nilai' => '12.345.678'],
                ['judul' => 'Status Pajak', 'nilai' => 'Aktif'],
                ['judul' => 'Nomor PBG', 'nilai' => 'PBG-2026-001'],
                ['judul' => 'Keterangan', 'nilai' => 'Sudah dilakukan verifikasi lapangan secara menyeluruh.']
            ]
        ]);

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/businesses', $payload);

        $response->assertStatus(201);
        $businessId = $response->json('data.id');

        $this->assertEquals(4, BusinessIndicator::where('business_id', $businessId)->count());
        $this->assertDatabaseHas('business_indicators', [
            'business_id' => $businessId,
            'judul' => 'Keterangan',
            'nilai' => 'Sudah dilakukan verifikasi lapangan secara menyeluruh.',
        ]);
    }

    /**
     * TEST 4: Edit judul indikator berhasil.
     */
    public function test_edit_indicator_judul_succeeds()
    {
        $admin = $this->getAdminUser();

        $business = Business::create($this->validBusinessPayload(['nib' => 'TEST004_' . uniqid()]));
        $indicator = BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Judul Lama',
            'nilai' => 'Nilai Tetap',
            'sort_order' => 1
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/businesses/{$business->id}", [
            'nib' => $business->nib,
            'nama_perusahaan' => $business->nama_perusahaan,
            'indicators' => [
                ['id' => $indicator->id, 'judul' => 'Judul Baru', 'nilai' => 'Nilai Tetap']
            ]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('business_indicators', [
            'id' => $indicator->id,
            'judul' => 'Judul Baru',
            'nilai' => 'Nilai Tetap'
        ]);
    }

    /**
     * TEST 5: Edit nilai indikator berhasil.
     */
    public function test_edit_indicator_nilai_succeeds()
    {
        $admin = $this->getAdminUser();

        $business = Business::create($this->validBusinessPayload(['nib' => 'TEST005_' . uniqid()]));
        $indicator = BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Status Pajak',
            'nilai' => 'Pending',
            'sort_order' => 1
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/businesses/{$business->id}", [
            'nib' => $business->nib,
            'nama_perusahaan' => $business->nama_perusahaan,
            'indicators' => [
                ['id' => $indicator->id, 'judul' => 'Status Pajak', 'nilai' => 'Sudah Lunas Terverifikasi']
            ]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('business_indicators', [
            'id' => $indicator->id,
            'judul' => 'Status Pajak',
            'nilai' => 'Sudah Lunas Terverifikasi'
        ]);
    }

    /**
     * TEST 6: Tambah indikator saat edit berhasil.
     */
    public function test_add_indicator_during_edit_succeeds()
    {
        $admin = $this->getAdminUser();

        $business = Business::create($this->validBusinessPayload(['nib' => 'TEST006_' . uniqid()]));
        $indicator1 = BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Indikator Awal',
            'nilai' => 'Nilai Awal',
            'sort_order' => 1
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/businesses/{$business->id}", [
            'nib' => $business->nib,
            'nama_perusahaan' => $business->nama_perusahaan,
            'indicators' => [
                ['id' => $indicator1->id, 'judul' => 'Indikator Awal', 'nilai' => 'Nilai Awal'],
                ['judul' => 'Indikator Tambahan Baru', 'nilai' => 'Nilai Tambahan']
            ]
        ]);

        $response->assertStatus(200);
        $this->assertEquals(2, BusinessIndicator::where('business_id', $business->id)->count());
        $this->assertDatabaseHas('business_indicators', [
            'business_id' => $business->id,
            'judul' => 'Indikator Tambahan Baru',
            'nilai' => 'Nilai Tambahan'
        ]);
    }

    /**
     * TEST 7: Hapus indikator saat edit berhasil.
     */
    public function test_delete_indicator_during_edit_succeeds()
    {
        $admin = $this->getAdminUser();

        $business = Business::create($this->validBusinessPayload(['nib' => 'TEST007_' . uniqid()]));
        $indicator1 = BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Indikator Tetap',
            'nilai' => 'Tetap Ada',
            'sort_order' => 1
        ]);
        $indicator2 = BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Indikator Dihapus',
            'nilai' => 'Akan Dihapus',
            'sort_order' => 2
        ]);

        // Kirim hanya indicator1 (indicator2 tidak disertakan sehingga harus dihapus)
        $response = $this->actingAs($admin)->putJson("/api/admin/businesses/{$business->id}", [
            'nib' => $business->nib,
            'nama_perusahaan' => $business->nama_perusahaan,
            'indicators' => [
                ['id' => $indicator1->id, 'judul' => 'Indikator Tetap', 'nilai' => 'Tetap Ada']
            ]
        ]);

        $response->assertStatus(200);
        $this->assertEquals(1, BusinessIndicator::where('business_id', $business->id)->count());
        $this->assertDatabaseMissing('business_indicators', ['id' => $indicator2->id]);
    }

    /**
     * TEST 8: Indikator hanya dimiliki business yang benar (Scoping Security).
     * Jika user mengirim id indikator milik business lain, indikator milik business lain tidak boleh berubah!
     */
    public function test_indicators_scoped_to_correct_business()
    {
        $admin = $this->getAdminUser();

        $businessOther = Business::create($this->validBusinessPayload(['nib' => 'OTHER_' . uniqid()]));
        $indicatorOther = BusinessIndicator::create([
            'business_id' => $businessOther->id,
            'judul' => 'Milik Usaha Lain',
            'nilai' => 'Nilai Rahasia',
            'sort_order' => 1
        ]);

        $businessMine = Business::create($this->validBusinessPayload(['nib' => 'MINE_' . uniqid()]));

        // Coba kirim id indicator milik businessOther saat mengupdate businessMine
        $response = $this->actingAs($admin)->putJson("/api/admin/businesses/{$businessMine->id}", [
            'nib' => $businessMine->nib,
            'nama_perusahaan' => $businessMine->nama_perusahaan,
            'indicators' => [
                ['id' => $indicatorOther->id, 'judul' => 'Bajak Indikator', 'nilai' => 'Nilai Terbajak']
            ]
        ]);

        $response->assertStatus(200);

        // Pastikan indikator milik businessOther TETAP UTUH dan tidak terbajak
        $this->assertDatabaseHas('business_indicators', [
            'id' => $indicatorOther->id,
            'business_id' => $businessOther->id,
            'judul' => 'Milik Usaha Lain',
            'nilai' => 'Nilai Rahasia'
        ]);
    }

    /**
     * TEST 9: Delete business menghapus indikator terkait (Cascade Delete).
     */
    public function test_deleting_business_cascades_and_deletes_indicators()
    {
        $admin = $this->getAdminUser();

        $business = Business::create($this->validBusinessPayload(['nib' => 'TEST009_' . uniqid()]));
        $ind = BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Akan Ikut Terhapus',
            'nilai' => 'Data 123',
            'sort_order' => 1
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/businesses/{$business->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('businesses', ['id' => $business->id]);
        $this->assertDatabaseMissing('business_indicators', ['id' => $ind->id]);
    }

    /**
     * TEST 10: Detail API mengembalikan indicators.
     */
    public function test_business_detail_api_returns_indicators()
    {
        $admin = $this->getAdminUser();

        $business = Business::create($this->validBusinessPayload(['nib' => 'TEST010_' . uniqid()]));
        BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Nomor Izin Khusus',
            'nilai' => 'IZIN-999-XYZ',
            'sort_order' => 1
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/businesses/{$business->id}");
        $response->assertStatus(200);

        $response->assertJsonStructure([
            'id',
            'nama_perusahaan',
            'indicators' => [
                '*' => ['id', 'business_id', 'judul', 'nilai', 'sort_order']
            ]
        ]);

        $this->assertEquals('Nomor Izin Khusus', $response->json('indicators.0.judul'));
        $this->assertEquals('IZIN-999-XYZ', $response->json('indicators.0.nilai'));
    }

    /**
     * TEST 11: Unauthenticated user tidak dapat mengakses endpoint admin yang dilindungi.
     */
    public function test_unauthenticated_user_cannot_access_protected_endpoints()
    {
        $business = Business::first();
        if (!$business) {
            $business = Business::create($this->validBusinessPayload(['nib' => 'GUEST_' . uniqid()]));
        }

        // POST businesses
        $resPost = $this->postJson('/api/admin/businesses', ['nama_perusahaan' => 'Hacker']);
        $this->assertTrue(in_array($resPost->status(), [401, 302]));

        // PUT businesses
        $resPut = $this->putJson("/api/admin/businesses/{$business->id}", ['nama_perusahaan' => 'Hacker']);
        $this->assertTrue(in_array($resPut->status(), [401, 302]));

        // DELETE businesses
        $resDel = $this->deleteJson("/api/admin/businesses/{$business->id}");
        $this->assertTrue(in_array($resDel->status(), [401, 302]));
    }

    /**
     * TEST 12: Public & Admin Map endpoint (query map=true) and Search eager load indicators for BusinessSidePanel.
     */
    public function test_map_endpoints_and_search_eager_load_indicators()
    {
        $business = Business::create($this->validBusinessPayload([
            'nib' => 'MAP_' . uniqid(),
            'nama_perusahaan' => 'PT Peta Indikator Sukses',
            'latitude' => -6.200000,
            'longitude' => 106.816666,
            'status' => 'Aktif',
        ]));

        BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Sertifikat Peta',
            'nilai' => 'CERT-MAP-12345',
            'sort_order' => 1
        ]);

        // 1. GET /api/businesses?map=true&zoom=15
        $mapRes = $this->getJson('/api/businesses?map=true&zoom=15');
        $mapRes->assertStatus(200);
        $mapData = collect($mapRes->json('data'));
        $found = $mapData->firstWhere('id', $business->id);
        $this->assertNotNull($found, 'Business should be found in map endpoint');
        $this->assertArrayHasKey('indicators', $found, 'Map marker must include indicators for BusinessSidePanel');
        $this->assertEquals('Sertifikat Peta', $found['indicators'][0]['judul']);

        // 2. GET /api/businesses/search?q=PT Peta Indikator Sukses
        $searchRes = $this->getJson('/api/businesses/search?q=PT Peta Indikator Sukses');
        $searchRes->assertStatus(200);
        $searchData = collect($searchRes->json());
        $foundSearch = $searchData->firstWhere('id', $business->id);
        $this->assertNotNull($foundSearch, 'Business should be found in search endpoint');
        $this->assertArrayHasKey('indicators', $foundSearch, 'Search result must include indicators for BusinessSidePanel');
        $this->assertEquals('Sertifikat Peta', $foundSearch['indicators'][0]['judul']);
    }

    /**
     * TEST 13: Import/Upsert process does not destroy existing indicators destructively.
     */
    public function test_import_or_upsert_preserves_existing_indicators_non_destructively()
    {
        $business = Business::create($this->validBusinessPayload([
            'id_proyek' => 'PROJ_IMPORT_' . uniqid(),
            'nib' => 'NIB_IMPORT_' . uniqid(),
            'nama_perusahaan' => 'PT Impor Jaya Abadi',
        ]));

        $ind = BusinessIndicator::create([
            'business_id' => $business->id,
            'judul' => 'Sertifikat ISO Khusus',
            'nilai' => 'ISO-9001-TEST',
            'sort_order' => 1
        ]);

        // Simulate BusinessesImport upsert logic with updated project name
        \Illuminate\Support\Facades\DB::table('businesses')->upsert(
            [[
                'id_proyek' => $business->id_proyek,
                'nib' => $business->nib,
                'nama_perusahaan' => 'PT Impor Jaya Abadi (Updated via CSV)',
                'updated_at' => now(),
            ]],
            ['nib', 'id_proyek'],
            ['nama_perusahaan', 'updated_at']
        );

        // Verify business was updated
        $freshBusiness = Business::with('indicators')->find($business->id);
        $this->assertEquals('PT Impor Jaya Abadi (Updated via CSV)', $freshBusiness->nama_perusahaan);

        // Verify indicators are 100% preserved
        $this->assertCount(1, $freshBusiness->indicators);
        $this->assertEquals('Sertifikat ISO Khusus', $freshBusiness->indicators->first()->judul);
        $this->assertEquals('ISO-9001-TEST', $freshBusiness->indicators->first()->nilai);
    }
}


