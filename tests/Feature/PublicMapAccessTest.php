<?php

namespace Tests\Feature;

use App\Models\PublicMapAccessLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicMapAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_record_access_without_nama_and_instansi()
    {
        $response = $this->postJson('/api/public-map-access', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['nama', 'instansi']);
    }

    public function test_cannot_record_access_with_whitespace_only()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama' => '    ',
            'instansi' => '   ',
        ]);

        $response->assertStatus(422);
    }

    public function test_can_record_valid_public_map_access_log()
    {
        $payload = [
            'nama' => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
        ];

        $response = $this->postJson('/api/public-map-access', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'nama' => 'Budi Santoso',
                'instansi' => 'DPMPTSP',
            ],
        ]);

        $this->assertDatabaseHas('public_map_access_logs', [
            'nama' => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
        ]);
    }

    public function test_admin_can_view_rekapitulasi_access_logs_with_stats()
    {
        $user = User::factory()->create(['role' => 'Administrator']);

        PublicMapAccessLog::create([
            'nama' => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
            'accessed_at' => now(),
            'ip_address' => '127.0.0.1',
        ]);

        PublicMapAccessLog::create([
            'nama' => 'Andi',
            'instansi' => 'BAPENDA',
            'accessed_at' => now(),
            'ip_address' => '127.0.0.1',
        ]);

        $response = $this->actingAs($user)->getJson('/api/admin/public-map-access-logs');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'meta' => [
                'total_access',
                'total_visitors',
                'today_access',
                'total_agencies',
                'agencies_list',
            ],
            'data' => [
                'data',
                'current_page',
                'total',
            ],
        ]);

        $this->assertEquals(2, $response->json('meta.total_access'));
        $this->assertEquals(2, $response->json('meta.total_visitors'));
    }

    public function test_unauthenticated_user_cannot_view_admin_rekapitulasi()
    {
        $response = $this->get('/api/admin/public-map-access-logs');
        $response->assertRedirect('/admin/login');
    }

    public function test_unique_visitor_counts_distinct_nama_plus_instansi_combination()
    {
        $user = User::factory()->create(['role' => 'Administrator']);

        // Andi in DPMPTSP
        PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'DPMPTSP', 'accessed_at' => now()]);
        // Andi in Dinas PU (different entity with same name)
        PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'Dinas PU', 'accessed_at' => now()]);
        // Repeat access by Andi DPMPTSP
        PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'DPMPTSP', 'accessed_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/admin/public-map-access-logs');

        $response->assertStatus(200);
        $this->assertEquals(3, $response->json('meta.total_access'));
        $this->assertEquals(2, $response->json('meta.total_visitors'));
    }

    public function test_public_endpoint_does_not_expose_ip_or_user_agent()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama' => 'Siti Rahma',
            'instansi' => 'Universitas X',
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertArrayNotHasKey('ip_address', $data);
        $this->assertArrayNotHasKey('user_agent', $data);
        $this->assertEquals('Siti Rahma', $data['nama']);
        $this->assertEquals('Universitas X', $data['instansi']);
    }
}

