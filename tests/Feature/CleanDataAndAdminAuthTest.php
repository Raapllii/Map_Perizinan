<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Business;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;

class CleanDataAndAdminAuthTest extends TestCase
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
            $table->string('jenis_kelamin')->nullable();
            $table->string('uraian_risiko_proyek')->nullable();
            $table->string('status')->default('Aktif');
            $table->string('kbli')->nullable();
            $table->string('judul_kbli')->nullable();
            $table->string('kecamatan_usaha')->nullable();
            $table->string('kelurahan_usaha')->nullable();
            $table->string('alamat_usaha')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('color')->nullable();
            $table->date('tanggal_terbit_oss')->nullable();
            $table->timestamps();
        });

        Schema::create('business_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->nullable();
            $table->string('judul')->nullable();
            $table->string('nilai')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color')->default('#0E5A8A');
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('time')->nullable();
            $table->string('action')->nullable();
            $table->string('name')->nullable();
            $table->string('status_type')->nullable();
            $table->foreignId('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->foreignId('business_id')->nullable();
            $table->string('business_name')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('public_map_access_logs', function (Blueprint $table) {
            $table->id();
            $table->string('nama')->nullable();
            $table->string('instansi')->nullable();
            $table->string('nik', 16)->nullable();
            $table->timestamp('accessed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('public_map_service_surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('public_map_access_log_id')->nullable();
            $table->foreignId('business_id')->nullable();
            $table->unsignedInteger('total_score')->default(0);
            $table->decimal('average_score', 4, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('public_map_service_survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->nullable();
            $table->foreignId('public_map_access_log_id')->nullable();
            $table->foreignId('business_id')->nullable();
            $table->string('indicator_key', 50)->nullable();
            $table->string('indicator_name', 150)->nullable();
            $table->text('question')->nullable();
            $table->string('answer_label', 100)->nullable();
            $table->unsignedTinyInteger('score')->default(0);
            $table->timestamps();
        });

        Schema::create('public_map_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('nik');
            $table->string('verification_token')->unique();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('nama_lengkap')->nullable();
            $table->string('jenis_kelamin')->nullable();
            $table->timestamps();
        });
    }

    public function test_admin_user_seeder_creates_main_super_admin()
    {
        $this->seed(\Database\Seeders\AdminUserSeeder::class);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@dpmptsp.co.id',
            'role' => 'Super Admin',
            'status' => 'Aktif',
            'name' => 'Super Administrator DPMPTSP',
        ]);

        $admin = User::where('email', 'admin@dpmptsp.co.id')->first();
        $this->assertTrue(Hash::check('kotasamarinda', $admin->password));
    }

    public function test_super_admin_can_login_with_correct_credentials()
    {
        $this->seed(\Database\Seeders\AdminUserSeeder::class);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@dpmptsp.co.id',
            'password' => 'kotasamarinda',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'role', 'status'],
        ]);
        $this->assertEquals('Super Admin', $response->json('user.role'));
        $this->assertEquals('Aktif', $response->json('user.status'));
    }

    public function test_login_fails_with_invalid_password()
    {
        $this->seed(\Database\Seeders\AdminUserSeeder::class);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@dpmptsp.co.id',
            'password' => 'wrongpassword123',
        ]);

        $response->assertStatus(401);
    }

    public function test_inactive_user_is_blocked_from_login()
    {
        User::create([
            'name' => 'Inactive User',
            'email' => 'inactive@dpmptsp.co.id',
            'password' => Hash::make('kotasamarinda'),
            'role' => 'Administrator',
            'status' => 'Nonaktif',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'inactive@dpmptsp.co.id',
            'password' => 'kotasamarinda',
        ]);

        $response->assertStatus(403);
        $this->assertStringContainsString('nonaktif', strtolower($response->json('message')));
    }

    public function test_super_admin_can_manage_users_and_create_new_user()
    {
        $this->seed(\Database\Seeders\AdminUserSeeder::class);
        $admin = User::where('email', 'admin@dpmptsp.co.id')->first();

        // 1. Super Admin can view user list
        $responseList = $this->actingAs($admin)->getJson('/api/admin/users');
        $responseList->assertStatus(200);

        // 2. Super Admin can create a new user
        $responseCreate = $this->actingAs($admin)->postJson('/api/admin/users', [
            'name' => 'Staf Verifikator Baru',
            'email' => 'verifikator@dpmptsp.co.id',
            'password' => 'password123',
            'role' => 'Verifier',
            'status' => 'Aktif',
        ]);

        $responseCreate->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'verifikator@dpmptsp.co.id',
            'role' => 'Verifier',
            'status' => 'Aktif',
        ]);

        // 3. Super Admin can toggle status
        $newUser = User::where('email', 'verifikator@dpmptsp.co.id')->first();
        $responseStatus = $this->actingAs($admin)->putJson("/api/admin/users/{$newUser->id}/status", [
            'status' => 'Nonaktif',
        ]);
        $responseStatus->assertStatus(200);
        $this->assertEquals('Nonaktif', $newUser->fresh()->status);
    }

    public function test_non_super_admin_cannot_create_or_promote_super_admin()
    {
        $admin = User::create([
            'name' => 'Regular Admin',
            'email' => 'regular@dpmptsp.co.id',
            'password' => Hash::make('secret123'),
            'role' => 'Administrator',
            'status' => 'Aktif',
        ]);

        // Trying to create Super Admin as Administrator
        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'name' => 'Hacker Admin',
            'email' => 'hacker@dpmptsp.co.id',
            'password' => 'secret123',
            'role' => 'Super Admin',
            'status' => 'Aktif',
        ]);

        $response->assertStatus(403);
    }

    public function test_dashboard_returns_zero_gracefully_when_tables_are_empty()
    {
        $this->seed(\Database\Seeders\AdminUserSeeder::class);
        $admin = User::where('email', 'admin@dpmptsp.co.id')->first();

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
        $data = $response->json();

        // Total usaha should be 0
        $this->assertEquals(0, $data['kpi']['total']['value'] ?? null);

        // Gender recap should exist and not throw exceptions
        $this->assertArrayHasKey('gender', $data);
        $this->assertEquals(0, $data['gender']['total'] ?? null);

        // Businesses datatable should be empty
        $responseBusinesses = $this->actingAs($admin)->getJson('/api/businesses');
        $responseBusinesses->assertStatus(200);
        $this->assertEmpty($responseBusinesses->json('data'));

        // Public map access logs should be empty
        $responseLogs = $this->actingAs($admin)->getJson('/api/admin/public-map-access-logs');
        $responseLogs->assertStatus(200);

        // Service surveys recap should return 200 with 0
        $responseSurveys = $this->actingAs($admin)->getJson('/api/admin/service-surveys/recap');
        $responseSurveys->assertStatus(200);
    }
}
