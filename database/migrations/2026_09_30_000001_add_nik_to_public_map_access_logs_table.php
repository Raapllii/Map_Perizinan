<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNikToPublicMapAccessLogsTable extends Migration
{
    public function up()
    {
        Schema::table('public_map_access_logs', function (Blueprint $table) {
            $table->string('nik', 16)->nullable()->after('instansi');
        });
    }

    public function down()
    {
        Schema::table('public_map_access_logs', function (Blueprint $table) {
            $table->dropColumn('nik');
        });
    }
}
