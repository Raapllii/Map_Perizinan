<?php

namespace Tests\Feature;

use App\Models\PublicMapVerification;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicMapAccessLogTest extends TestCase
{
    use DatabaseTransactions;

    private function createVerification(string $nik = '3201234567890001', string $nama = 'Budi Santoso'): string
    {
        $plainToken = Str::random(64);
        PublicMapVerification::create([
            'token_hash'    => hash('sha256', $plainToken),
            'verified_nik'  => $nik,
            'verified_name' => $nama,
            'expires_at'    => now()->addMinutes(5),
            'used_at'       => null,
        ]);
        return $plainToken;
    }

    public function test_store_records_server_verified_nik_from_token()
    {
        $token = $this->createVerification('3201234567890001', 'Budi Santoso');

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Budi Santoso',
            'instansi'           => 'DPMPTSP',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('public_map_access_logs', [
            'nik'      => '3201234567890001',
            'nama'     => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
        ]);
    }

    public function test_store_rejects_client_supplied_nik()
    {
        $token = $this->createVerification('3201234567890001', 'Budi Santoso');

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nik'                => '3201234567890001',
            'nama'               => 'Budi Santoso',
            'instansi'           => 'DPMPTSP',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nik']);
    }

    public function test_store_response_does_not_include_nik()
    {
        $token = $this->createVerification('3201234567890002', 'Siti Rahma');

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Siti Rahma',
            'instansi'           => 'BAPENDA',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('nik', $response->json('data'));
    }

    public function test_store_response_does_not_include_ip_address()
    {
        $token = $this->createVerification('3201234567890003', 'Agus Wijaya');

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Agus Wijaya',
            'instansi'           => 'Swasta',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('ip_address', $response->json('data'));
    }

    public function test_store_response_does_not_include_user_agent()
    {
        $token = $this->createVerification('3201234567890004', 'Rini Pratiwi');

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Rini Pratiwi',
            'instansi'           => 'Umum',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('user_agent', $response->json('data'));
    }
}
