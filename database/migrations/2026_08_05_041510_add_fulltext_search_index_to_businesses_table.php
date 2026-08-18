<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class AddFulltextSearchIndexToBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
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
                    COALESCE(kecamatan, '') || ' ' ||
                    COALESCE(kelurahan, '') || ' ' ||
                    COALESCE(alamat_proyek, '')
                )
            )
        ");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('DROP INDEX IF EXISTS search_fulltext');
    }
}