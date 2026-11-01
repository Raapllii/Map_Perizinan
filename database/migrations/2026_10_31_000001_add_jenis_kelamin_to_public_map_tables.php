<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Persists the verified gender (`jenis_kelamin`) received from Dukcapil API
     * in `public_map_verifications` (during token lifecycle) and permanently in
     * `public_map_access_logs` (for visitor gender recapitulation & Excel export).
     */
    public function up(): void
    {
        if (Schema::hasTable('public_map_verifications') && !Schema::hasColumn('public_map_verifications', 'verified_gender')) {
            Schema::table('public_map_verifications', function (Blueprint $table) {
                $table->string('verified_gender', 32)->nullable()->after('verified_name');
            });
        }

        if (Schema::hasTable('public_map_access_logs') && !Schema::hasColumn('public_map_access_logs', 'jenis_kelamin')) {
            Schema::table('public_map_access_logs', function (Blueprint $table) {
                $table->string('jenis_kelamin', 32)->nullable()->after('nik');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('public_map_verifications') && Schema::hasColumn('public_map_verifications', 'verified_gender')) {
            Schema::table('public_map_verifications', function (Blueprint $table) {
                $table->dropColumn('verified_gender');
            });
        }

        if (Schema::hasTable('public_map_access_logs') && Schema::hasColumn('public_map_access_logs', 'jenis_kelamin')) {
            Schema::table('public_map_access_logs', function (Blueprint $table) {
                $table->dropColumn('jenis_kelamin');
            });
        }
    }
};

