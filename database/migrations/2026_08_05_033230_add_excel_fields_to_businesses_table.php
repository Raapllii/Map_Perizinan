<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddExcelFieldsToBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('jenis_perusahaan')->nullable();
            $table->string('skala_usaha')->nullable();
            $table->string('propinsi')->nullable();
            $table->string('kabupaten')->nullable();
            $table->string('profile_name')->nullable();
            $table->string('day_of_tanggal_terbit_oss')->nullable();
            $table->string('uraian_jenis_perusahaan')->nullable();
            $table->string('sektor')->nullable();
            $table->string('nama_user')->nullable();
            $table->string('nik')->nullable();
            $table->string('email')->nullable();
            $table->string('telp')->nullable();
            $table->decimal('luasan_pd', 20, 2)->nullable();
            $table->string('satuan_luasan_pd')->nullable();
            $table->decimal('mesin_peralatan_impor', 20, 2)->nullable();
            $table->decimal('mesin_peralatan_lokal', 20, 2)->nullable();
            $table->decimal('pembelian_pematangan_tanah', 20, 2)->nullable();
            $table->decimal('bangunan_gedung', 20, 2)->nullable();
            $table->decimal('modal_kerja', 20, 2)->nullable();
            $table->decimal('lain_lain', 20, 2)->nullable();
            $table->decimal('jumlah_investasi', 20, 2)->nullable();
            $table->integer('tki')->nullable();

            $table->index('nama_perusahaan');
            $table->index('kelurahan');
            $table->index('kbli');
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
            $table->dropIndex(['nama_perusahaan']);
            $table->dropIndex(['kelurahan']);
            $table->dropIndex(['kbli']);

            $table->dropColumn([
                'jenis_perusahaan',
                'skala_usaha',
                'propinsi',
                'kabupaten',
                'profile_name',
                'day_of_tanggal_terbit_oss',
                'uraian_jenis_perusahaan',
                'sektor',
                'nama_user',
                'nik',
                'email',
                'telp',
                'luasan_pd',
                'satuan_luasan_pd',
                'mesin_peralatan_impor',
                'mesin_peralatan_lokal',
                'pembelian_pematangan_tanah',
                'bangunan_gedung',
                'modal_kerja',
                'lain_lain',
                'jumlah_investasi',
                'tki'
            ]);
        });
    }
}
