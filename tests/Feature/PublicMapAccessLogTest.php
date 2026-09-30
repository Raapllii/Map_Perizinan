<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicMapAccessLogTest extends TestCase
{
    use RefreshDatabase;
    public function test_store_records_nik_when_provided()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama'     => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
            'nik'      => '3201234567890001',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('public_map_access_logs', [
            'nik' => '3201234567890001',
        ]);
    }

    public function test_store_works_without_nik()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama'     => 'Anonim',
            'instansi' => 'Umum',
        ]);

        $response->assertStatus(201);
    }

    // ── F: Public response must not expose sensitive fields ──────────────────

    public function test_store_response_does_not_include_nik()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama'     => 'Siti Rahma',
            'instansi' => 'BAPENDA',
            'nik'      => '3201234567890002',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('nik', $response->json('data'));
    }

    public function test_store_response_does_not_include_ip_address()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama'     => 'Agus Wijaya',
            'instansi' => 'Swasta',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('ip_address', $response->json('data'));
    }

    public function test_store_response_does_not_include_user_agent()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama'     => 'Rini Pratiwi',
            'instansi' => 'Umum',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('user_agent', $response->json('data'));
    }
}
