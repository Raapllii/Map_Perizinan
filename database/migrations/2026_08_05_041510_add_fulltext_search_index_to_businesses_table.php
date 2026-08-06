<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFulltextSearchIndexToBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('businesses', function (Blueprint $table) {
            // Check if column id_proyek is not null or whatever, but FULLTEXT works on all VARCHAR/TEXT
            \DB::statement('ALTER TABLE businesses ADD FULLTEXT search_fulltext (nama_perusahaan, judul_kbli, kbli, nib, id_proyek, kecamatan, kelurahan, alamat_proyek)');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('businesses', function (Blueprint $table) {
            \DB::statement('ALTER TABLE businesses DROP INDEX search_fulltext');
        });
    }
}
