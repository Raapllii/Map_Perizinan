<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->string('id_proyek')->nullable();
            $table->string('nib')->index();
            $table->string('nama_perusahaan');
            $table->string('risiko')->nullable();
            $table->string('kbli')->nullable();
            $table->string('judul_kbli')->nullable();
            $table->text('alamat_proyek')->nullable();
            $table->string('kecamatan')->index()->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('status_pm')->nullable();
            $table->string('status')->default('Aktif');
            $table->date('tgl_terbit')->nullable();
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->string('color')->nullable();
            
            // Unique constraint on nib + id_proyek (if both exist) to prevent duplicates during upsert
            $table->unique(['nib', 'id_proyek']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('businesses');
    }
}
