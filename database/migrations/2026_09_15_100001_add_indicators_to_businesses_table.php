<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIndicatorsToBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->text('indicator_1')->nullable();
            $table->text('indicator_2')->nullable();
            $table->text('indicator_3')->nullable();
            $table->text('indicator_4')->nullable();
            $table->text('indicator_5')->nullable();
            $table->text('indicator_6')->nullable();
            $table->text('indicator_7')->nullable();
            $table->text('indicator_8')->nullable();
            $table->text('indicator_9')->nullable();
            $table->text('indicator_10')->nullable();
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
            $table->dropColumn([
                'indicator_1',
                'indicator_2',
                'indicator_3',
                'indicator_4',
                'indicator_5',
                'indicator_6',
                'indicator_7',
                'indicator_8',
                'indicator_9',
                'indicator_10',
            ]);
        });
    }
}
