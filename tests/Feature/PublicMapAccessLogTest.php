<?php

namespace Tests\Feature;

use Tests\TestCase;

class PublicMapAccessLogTest extends TestCase
{
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
}
