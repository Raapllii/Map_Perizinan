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
}
