<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateBusinessesTable extends Migration
{
    public function up()
    {
        // Enable PostGIS extension
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis;');

        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            
            // The 27 OSS columns
            $table->string('id_proyek')->nullable();
            $table->string('uraian_jenis_proyek')->nullable();
            $table->string('nib')->index();
            $table->string('nama_perusahaan')->nullable();
            $table->date('tanggal_terbit_oss')->nullable();
            $table->string('uraian_status_penanaman_modal')->nullable();
            $table->string('uraian_jenis_perusahaan')->nullable();
            $table->string('uraian_risiko_proyek')->nullable();
            $table->text('nama_proyek')->nullable();
            $table->string('uraian_skala_usaha')->nullable();
            $table->text('alamat_usaha')->nullable();
            $table->string('kab_kota_usaha')->nullable();
            $table->string('kecamatan_usaha')->index()->nullable();
            $table->string('kelurahan_usaha')->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->string('day_of_tanggal_pengajuan_proyek')->nullable();
            $table->string('kbli')->nullable();
            $table->string('judul_kbli')->nullable();
            $table->string('kl_sektor_pembina')->nullable();
            $table->string('nama_user')->nullable();
            $table->string('email')->nullable();
            $table->string('nomor_telp')->nullable();
            $table->decimal('luas_tanah', 20, 2)->nullable();
            $table->string('satuan_tanah')->nullable();
            $table->decimal('jumlah_investasi', 20, 2)->nullable();
            $table->integer('tki')->nullable();
            
            // Internal Application columns
            $table->string('status')->default('Aktif');
            $table->string('color')->nullable();
            
            $table->timestamps();

            // Unique constraint for upsert
            $table->unique(['nib', 'id_proyek']);
        });

        // Add PostGIS location column
        DB::statement('ALTER TABLE businesses ADD COLUMN location geometry(Point, 4326);');

        // Create GiST spatial index on PostGIS location
        DB::statement('CREATE INDEX IF NOT EXISTS businesses_location_gist ON businesses USING GIST (location);');

        // Create Fulltext Search index
        DB::statement("
            CREATE INDEX search_fulltext
            ON businesses
            USING GIN (
                to_tsvector(
                    'simple',
                    COALESCE(nama_perusahaan, '') || ' ' ||
                    COALESCE(judul_kbli, '') || ' ' ||
                    COALESCE(kbli, '') || ' ' ||
                    COALESCE(nib, '') || ' ' ||
                    COALESCE(id_proyek, '') || ' ' ||
                    COALESCE(kecamatan_usaha, '') || ' ' ||
                    COALESCE(kelurahan_usaha, '') || ' ' ||
                    COALESCE(alamat_usaha, '')
                )
            )
        ");
    }

    public function down()
    {
        DB::statement('DROP INDEX IF EXISTS search_fulltext');
        DB::statement('DROP INDEX IF EXISTS businesses_location_gist');
        Schema::dropIfExists('businesses');
    }
}
