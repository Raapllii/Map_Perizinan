<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\PublicMapAccessLog;
use App\Models\PublicMapFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicMapFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_submit_feedback_with_valid_access_log_id()
    {
        $log = PublicMapAccessLog::create([
            'nama' => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
            'accessed_at' => now(),
        ]);

        $response = $this->postJson('/api/public-map-feedback', [
            'access_log_id' => $log->id,
            'rating' => 'happy',
            'feedback' => 'Tampilan peta sangat interaktif dan membantu riset lokasi.',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'message' => 'Terima kasih, masukan Anda berhasil disimpan.',
        ]);

        $this->assertDatabaseHas('public_map_feedbacks', [
            'public_map_access_log_id' => $log->id,
            'rating' => 'happy',
            'feedback' => 'Tampilan peta sangat interaktif dan membantu riset lokasi.',
        ]);
    }

    public function test_cannot_submit_feedback_without_access_log_id()
    {
        $response = $this->postJson('/api/public-map-feedback', [
            'rating' => 'happy',
            'feedback' => 'Test masukan',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['access_log_id']);
    }

    public function test_cannot_submit_feedback_with_non_existent_access_log_id()
    {
        $response = $this->postJson('/api/public-map-feedback', [
            'access_log_id' => 999999,
            'rating' => 'happy',
            'feedback' => 'Test masukan',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['access_log_id']);
    }

    public function test_cannot_submit_feedback_with_invalid_rating()
    {
        $log = PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'Dinas', 'accessed_at' => now()]);

        $response = $this->postJson('/api/public-map-feedback', [
            'access_log_id' => $log->id,
            'rating' => 'super-awesome-invalid',
            'feedback' => 'Cukup baik',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['rating']);
    }

    public function test_cannot_submit_feedback_with_empty_or_too_short_feedback()
    {
        $log = PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'Dinas', 'accessed_at' => now()]);

        $response = $this->postJson('/api/public-map-feedback', [
            'access_log_id' => $log->id,
            'rating' => 'neutral',
            'feedback' => ' ',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['feedback']);
    }

    public function test_public_map_access_endpoint_returns_access_log_id_explicitly()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama' => 'Budi Pengunjung',
            'instansi' => 'Universitas Mulawarman',
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('access_log_id', $data);
        $this->assertEquals($data['id'], $data['access_log_id']);
    }

    public function test_admin_rekapitulasi_eager_loads_feedback()
    {
        $user = User::factory()->create(['role' => 'Administrator']);
        $log = PublicMapAccessLog::create(['nama' => 'Siti', 'instansi' => 'Bapenda', 'accessed_at' => now()]);

        PublicMapFeedback::create([
            'public_map_access_log_id' => $log->id,
            'rating' => 'neutral',
            'feedback' => 'Peta sudah cukup informatif.',
        ]);

        $response = $this->actingAs($user)->getJson('/api/admin/public-map-access-logs');
        $response->assertStatus(200);

        $row = $response->json('data.data.0');
        $this->assertNotNull($row['feedback']);
        $this->assertEquals('neutral', $row['feedback']['rating']);
        $this->assertEquals('Peta sudah cukup informatif.', $row['feedback']['feedback']);
    }
}
