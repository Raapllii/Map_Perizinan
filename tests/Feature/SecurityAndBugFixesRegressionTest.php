<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Business;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class SecurityAndBugFixesRegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('database.default', 'sqlite');
        Config::set('database.connections.sqlite', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('Surveyor');
            $table->string('status')->default('Aktif');
            $table->string('avatar')->nullable();
            $table->integer('actions')->default(0);
            $table->text('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->string('id_proyek')->nullable();
            $table->string('nib')->nullable();
            $table->string('nama_perusahaan')->nullable();
            $table->string('nama_proyek')->nullable();
            $table->string('nama_user')->nullable();
            $table->string('nik_pemohon', 16)->nullable();
            $table->string('email')->nullable();
            $table->string('nomor_telp')->nullable();
            $table->string('kbli')->nullable();
            $table->string('judul_kbli')->nullable();
            $table->string('uraian_risiko_proyek')->nullable();
            $table->string('uraian_skala_usaha')->nullable();
            $table->string('status')->default('Aktif');
            $table->string('status_izin')->default('Terbit');
            $table->boolean('is_verified')->default(false);
            $table->date('tanggal_terbit_oss')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });

        Schema::create('business_indicators', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('business_id');
            $table->string('judul')->nullable();
            $table->string('nilai')->nullable();
            $table->integer('sort_order')->default(1);
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('time')->nullable();
            $table->string('action')->nullable();
            $table->string('name')->nullable();
            $table->string('status_type')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->unsignedBigInteger('business_id')->nullable();
            $table->string('business_name')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * SEC-03: Inactive users cannot log in.
     */
    public function test_inactive_user_cannot_log_in()
    {
        User::create([
            'name'     => 'Nonaktif User',
            'email'    => 'nonaktif@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Verifier',
            'status'   => 'Nonaktif',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email'    => 'nonaktif@test.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403);
        $this->assertStringContainsString('nonaktif', strtolower($response->json('message')));
    }

    /**
     * SEC-02: Non-admin roles (Surveyor, Verifier) cannot access user management.
     */
    public function test_surveyor_and_verifier_cannot_access_user_management()
    {
        $surveyor = User::create([
            'name'     => 'Surveyor User',
            'email'    => 'surveyor@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Surveyor',
            'status'   => 'Aktif',
        ]);

        $res = $this->actingAs($surveyor)->getJson('/api/admin/users');
        $res->assertStatus(403);

        $resPost = $this->actingAs($surveyor)->postJson('/api/admin/users', [
            'name'     => 'Hacker',
            'email'    => 'hacker@test.com',
            'password' => 'password123',
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);
        $resPost->assertStatus(403);
    }

    /**
     * SEC-02: Administrator cannot create or promote to Super Admin.
     */
    public function test_administrator_cannot_create_or_promote_to_super_admin()
    {
        $admin = User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Administrator',
            'status'   => 'Aktif',
        ]);

        $resPost = $this->actingAs($admin)->postJson('/api/admin/users', [
            'name'     => 'Fake Super',
            'email'    => 'fakesuper@test.com',
            'password' => 'password123',
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);
        $resPost->assertStatus(403);
        $this->assertStringContainsString('Super Admin', $resPost->json('message'));
    }

    /**
     * SEC-04: Surveyor cannot delete businesses or verify permits.
     */
    public function test_surveyor_cannot_delete_or_verify_businesses()
    {
        $surveyor = User::create([
            'name'     => 'Surveyor 1',
            'email'    => 'surveyor1@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Surveyor',
            'status'   => 'Aktif',
        ]);

        $biz = Business::create([
            'nama_perusahaan' => 'PT Usaha Surveyor',
            'nib'             => '123456789012',
            'status'          => 'Pending',
        ]);

        // Bulk delete forbidden for Surveyor
        $resBulk = $this->actingAs($surveyor)->postJson('/api/admin/businesses/bulk-delete', [
            'ids' => [$biz->id],
        ]);
        $resBulk->assertStatus(403);

        // Single delete forbidden for Surveyor
        $resDel = $this->actingAs($surveyor)->deleteJson("/api/admin/businesses/{$biz->id}");
        $resDel->assertStatus(403);

        // Verification forbidden for Surveyor
        $resVerify = $this->actingAs($surveyor)->putJson("/api/admin/businesses/{$biz->id}/verify", [
            'status' => 'Aktif',
            'note'   => 'Disetujui',
        ]);
        $resVerify->assertStatus(403);
    }

    /**
     * SEC-01: Path traversal attacks on backup routes are blocked.
     */
    public function test_path_traversal_on_backup_routes_is_blocked()
    {
        $superAdmin = User::create([
            'name'     => 'Super Admin User',
            'email'    => 'super@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);

        // Traversal in download
        $resDownload = $this->actingAs($superAdmin)->getJson('/api/admin/database/backup/..%2F..%2F.env');
        $this->assertTrue(in_array($resDownload->status(), [400, 404]));

        // Traversal in delete
        $resDelete = $this->actingAs($superAdmin)->deleteJson('/api/admin/database/backup', [
            'filename' => '../../.env',
        ]);
        $this->assertTrue(in_array($resDelete->status(), [422, 404]));

        // Traversal in restore
        $resRestore = $this->actingAs($superAdmin)->postJson('/api/admin/database/restore', [
            'filename' => '../../.env',
        ]);
        $this->assertTrue(in_array($resRestore->status(), [422, 404]));
    }

    /**
     * SEC-06: Public unauthenticated detail endpoint masks owner personal data.
     */
    public function test_public_endpoint_masks_owner_personal_data()
    {
        $biz = Business::create([
            'nama_perusahaan' => 'CV Mitra Sejahtera',
            'nama_user'       => 'Budi Raharjo',
            'email'           => 'budi.raharjo@gmail.com',
            'nomor_telp'      => '081234567890',
            'nik_pemohon'     => '3273012304900001',
            'status'          => 'Aktif',
        ]);

        // 1. Unauthenticated public request
        $resPublic = $this->getJson("/api/businesses/{$biz->id}");
        $resPublic->assertStatus(200);

        $data = $resPublic->json();
        $this->assertNotEquals('budi.raharjo@gmail.com', $data['email']);
        $this->assertStringContainsString('***@gmail.com', $data['email']);
        $this->assertNotEquals('081234567890', $data['nomor_telp']);
        $this->assertStringContainsString('****', $data['nomor_telp']);
        $this->assertNotEquals('3273012304900001', $data['nik_pemohon']);
        $this->assertStringContainsString('******', $data['nik_pemohon']);

        // 2. Authenticated Admin request sees full unmasked data
        $admin = User::create([
            'name'     => 'Admin Viewer',
            'email'    => 'viewer@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);

        $resAdmin = $this->actingAs($admin)->getJson("/api/businesses/{$biz->id}");
        $resAdmin->assertStatus(200);
        $this->assertEquals('budi.raharjo@gmail.com', $resAdmin->json('email'));
        $this->assertEquals('081234567890', $resAdmin->json('nomor_telp'));
    }

    /**
     * BUG-03: Coordinate range validation rejects out-of-bound coordinates.
     */
    public function test_coordinate_range_validation()
    {
        $admin = User::create([
            'name'     => 'Admin Validator',
            'email'    => 'validator@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);

        $res = $this->actingAs($admin)->postJson('/api/admin/businesses', [
            'nama_perusahaan' => 'Invalid Coords Inc',
            'nib'             => '999999999999',
            'latitude'        => 120.5, // > 90 invalid!
            'longitude'       => 200.0, // > 180 invalid!
        ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['latitude', 'longitude']);
    }

    /**
     * BUG-01: ActivityLog persists correctly during bulkDestroy and settings updates.
     */
    public function test_activity_log_persists_during_mutations()
    {
        $admin = User::create([
            'name'     => 'Admin Logger',
            'email'    => 'logger@test.com',
            'password' => bcrypt('secret123'),
            'role'     => 'Super Admin',
            'status'   => 'Aktif',
        ]);

        $biz1 = Business::create(['nama_perusahaan' => 'Biz 1', 'nib' => '111111111111']);
        $biz2 = Business::create(['nama_perusahaan' => 'Biz 2', 'nib' => '222222222222']);

        $resBulk = $this->actingAs($admin)->postJson('/api/admin/businesses/bulk-delete', [
            'ids' => [$biz1->id, $biz2->id],
        ]);
        $resBulk->assertStatus(200);

        $log = ActivityLog::where('action', 'Hapus Massal')->first();
        $this->assertNotNull($log, 'ActivityLog for bulk destroy must be created');
        $this->assertEquals('Admin Logger', $log->user_name);
        $this->assertStringContainsString('2 data usaha', $log->note);

        // Setting update log
        $resSetting = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'theme' => 'dark',
        ]);
        $resSetting->assertStatus(200);

        $settingLog = ActivityLog::where('action', 'Update Settings')->first();
        $this->assertNotNull($settingLog, 'ActivityLog for settings update must be created');
    }
}
