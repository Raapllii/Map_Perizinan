<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPerformanceIndexesToBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->index('status');
            $table->index('tgl_terbit');
            $table->index('judul_kbli');
            $table->index(['lat', 'lng']); // composite index for spatial-like bounding box queries if needed
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
            $table->dropIndex(['status']);
            $table->dropIndex(['tgl_terbit']);
            $table->dropIndex(['judul_kbli']);
            $table->dropIndex(['lat', 'lng']);
        });
    }
}
