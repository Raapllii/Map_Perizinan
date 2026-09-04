<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class MakeNamaPerusahaanNullableInBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement('ALTER TABLE businesses ALTER COLUMN nama_perusahaan DROP NOT NULL;');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Replace NULL values with fallback before reinstating NOT NULL constraint
        DB::statement("UPDATE businesses SET nama_perusahaan = '' WHERE nama_perusahaan IS NULL;");
        DB::statement('ALTER TABLE businesses ALTER COLUMN nama_perusahaan SET NOT NULL;');
    }
}
