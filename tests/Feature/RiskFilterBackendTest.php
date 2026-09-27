<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiskFilterBackendTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_filters_businesses_by_risk_level_case_insensitively()
    {
        Business::create([
            'nama_perusahaan' => 'PT Usaha Rendah',
            'nib' => '1111111111',
            'uraian_risiko_proyek' => 'Rendah',
            'latitude' => '-0.502106',
            'longitude' => '117.153709',
        ]);

        Business::create([
            'nama_perusahaan' => 'PT Usaha Tinggi',
            'nib' => '2222222222',
            'uraian_risiko_proyek' => 'TINGGI',
            'latitude' => '-0.503000',
            'longitude' => '117.154000',
        ]);

        // Query with lower-case "rendah"
        $response1 = $this->getJson('/api/businesses?map=true&zoom=15&uraian_risiko_proyek=rendah');
        $response1->assertStatus(200);
        $data1 = $response1->json('data');
        $this->assertCount(1, $data1);
        $this->assertEquals('PT Usaha Rendah', $data1[0]['nama_perusahaan']);

        // Query with parameter "risiko=Tinggi"
        $response2 = $this->getJson('/api/businesses?map=true&zoom=15&risiko=Tinggi');
        $response2->assertStatus(200);
        $data2 = $response2->json('data');
        $this->assertCount(1, $data2);
        $this->assertEquals('PT Usaha Tinggi', $data2[0]['nama_perusahaan']);
    }

    public function test_api_filters_businesses_with_multiple_risk_levels()
    {
        Business::create([
            'nama_perusahaan' => 'PT Alpha',
            'nib' => '3333333333',
            'uraian_risiko_proyek' => 'Rendah',
            'latitude' => '-0.502106',
            'longitude' => '117.153709',
        ]);

        Business::create([
            'nama_perusahaan' => 'PT Beta',
            'nib' => '4444444444',
            'uraian_risiko_proyek' => 'Menengah Rendah',
            'latitude' => '-0.503000',
            'longitude' => '117.154000',
        ]);

        Business::create([
            'nama_perusahaan' => 'PT Gamma',
            'nib' => '5555555555',
            'uraian_risiko_proyek' => 'Tinggi',
            'latitude' => '-0.504000',
            'longitude' => '117.155000',
        ]);

        // Filter Rendah & Menengah Rendah
        $response = $this->getJson('/api/businesses?map=true&zoom=15&uraian_risiko_proyek=' . urlencode('Rendah,Menengah Rendah'));
        $response->assertStatus(200);
        $names = collect($response->json('data'))->pluck('nama_perusahaan')->all();

        $this->assertContains('PT Alpha', $names);
        $this->assertContains('PT Beta', $names);
        $this->assertNotContains('PT Gamma', $names);
    }
}
