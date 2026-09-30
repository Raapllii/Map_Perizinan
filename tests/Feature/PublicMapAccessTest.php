<?php

namespace Tests\Feature;

use App\Models\PublicMapAccessLog;
use App\Models\PublicMapVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicMapAccessTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Helper to create a test verification token in public_map_verifications table.
     */
    private function createVerification(string $nik = '3201234567890001', string $nama = 'Budi Santoso', int $minutesTtl = 5): string
    {
        $plainToken = Str::random(64);
        PublicMapVerification::create([
            'token_hash'    => hash('sha256', $plainToken),
            'verified_nik'  => $nik,
            'verified_name' => $nama,
            'expires_at'    => now()->addMinutes($minutesTtl),
            'used_at'       => null,
        ]);
        return $plainToken;
    }

    public function test_cannot_record_access_without_verification_token()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama'     => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['verification_token']);
    }

    public function test_cannot_record_access_using_nik_directly_or_as_substitute()
    {
        // Attempt 1: Providing NIK instead of verification_token
        $responseWithoutToken = $this->postJson('/api/public-map-access', [
            'nik'      => '3201234567890001',
            'nama'     => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
        ]);
        $responseWithoutToken->assertStatus(422);

        // Attempt 2: Providing client-supplied NIK along with token (must be explicitly rejected)
        $token = $this->createVerification();
        $responseWithNik = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nik'                => '3201234567890001',
            'nama'               => 'Budi Santoso',
            'instansi'           => 'DPMPTSP',
        ]);
        $responseWithNik->assertStatus(422)
                        ->assertJsonValidationErrors(['nik']);
    }

    public function test_cannot_record_access_without_nama_and_instansi()
    {
        $token = $this->createVerification();
        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['nama', 'instansi']);
    }

    public function test_cannot_record_access_with_whitespace_only()
    {
        $token = $this->createVerification();
        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => '    ',
            'instansi'           => '   ',
        ]);

        $response->assertStatus(422);
    }

    public function test_can_record_valid_public_map_access_log_with_verification_token()
    {
        $verifiedNik  = '3201234567890001';
        $verifiedName = 'Budi Santoso';
        $token = $this->createVerification($verifiedNik, $verifiedName);

        $payload = [
            'verification_token' => $token,
            'nama'               => $verifiedName,
            'instansi'           => 'DPMPTSP',
        ];

        $response = $this->postJson('/api/public-map-access', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'data'   => [
                'nama'     => 'Budi Santoso',
                'instansi' => 'DPMPTSP',
            ],
        ]);

        // Verify the access log was recorded with the server-authoritative verified NIK
        $this->assertDatabaseHas('public_map_access_logs', [
            'nama'     => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
            'nik'      => $verifiedNik,
        ]);

        // Verify the verification record was marked as used
        $tokenHash = hash('sha256', $token);
        $record = PublicMapVerification::where('token_hash', $tokenHash)->first();
        $this->assertNotNull($record);
        $this->assertNotNull($record->used_at);
    }

    public function test_rejects_expired_verification_token()
    {
        // Token expired 2 minutes ago
        $token = $this->createVerification('3201234567890001', 'Budi Santoso', -2);

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Budi Santoso',
            'instansi'           => 'DPMPTSP',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Token verifikasi telah kedaluwarsa.']);
    }

    public function test_rejects_reused_verification_token()
    {
        $token = $this->createVerification('3201234567890001', 'Budi Santoso');

        $payload = [
            'verification_token' => $token,
            'nama'               => 'Budi Santoso',
            'instansi'           => 'DPMPTSP',
        ];

        // First use: SUCCESS
        $firstResponse = $this->postJson('/api/public-map-access', $payload);
        $firstResponse->assertStatus(201);

        // Second use of same token: REJECTED
        $secondResponse = $this->postJson('/api/public-map-access', $payload);
        $secondResponse->assertStatus(422);
        $secondResponse->assertJsonFragment(['message' => 'Token verifikasi sudah pernah digunakan.']);
    }

    public function test_rejects_mismatched_nama_with_verified_name()
    {
        $token = $this->createVerification('3201234567890001', 'Budi Santoso');

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Hacker Impersonator',
            'instansi'           => 'DPMPTSP',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['nama']);
    }

    public function test_public_endpoint_does_not_expose_nik_ip_user_agent_or_token()
    {
        $verifiedNik = '3201234567899999';
        $token = $this->createVerification($verifiedNik, 'Siti Rahma');

        $response = $this->postJson('/api/public-map-access', [
            'verification_token' => $token,
            'nama'               => 'Siti Rahma',
            'instansi'           => 'Universitas X',
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertArrayNotHasKey('nik', $data);
        $this->assertArrayNotHasKey('ip_address', $data);
        $this->assertArrayNotHasKey('user_agent', $data);
        $this->assertArrayNotHasKey('verification_token', $data);
        $this->assertArrayNotHasKey('token_hash', $data);

        // Entire response body must never contain the verified NIK
        $this->assertStringNotContainsString($verifiedNik, $response->content());

        $this->assertEquals('Siti Rahma', $data['nama']);
        $this->assertEquals('Universitas X', $data['instansi']);
    }

    public function test_admin_can_view_rekapitulasi_access_logs_with_stats()
    {
        $user = User::factory()->create(['role' => 'Administrator']);

        PublicMapAccessLog::create([
            'nama'        => 'Budi Santoso',
            'instansi'    => 'DPMPTSP',
            'accessed_at' => now(),
            'ip_address'  => '127.0.0.1',
        ]);

        PublicMapAccessLog::create([
            'nama'        => 'Andi',
            'instansi'    => 'BAPENDA',
            'accessed_at' => now(),
            'ip_address'  => '127.0.0.1',
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
}
