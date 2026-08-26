<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddOss2024FieldsToBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('uraian_jenis_proyek')->nullable();
            $table->text('nama_proyek')->nullable();
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
            $table->dropColumn(['uraian_jenis_proyek', 'nama_proyek']);
        });
    }
}
