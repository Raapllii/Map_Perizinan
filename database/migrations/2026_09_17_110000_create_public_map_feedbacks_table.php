<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePublicMapFeedbacksTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('public_map_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('public_map_access_log_id')
                ->constrained('public_map_access_logs')
                ->cascadeOnDelete();
            $table->foreignId('business_id')
                ->nullable()
                ->constrained('businesses')
                ->nullOnDelete();
            $table->string('rating', 50); // very-sad, sad, neutral, happy
            $table->text('feedback');
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
        Schema::dropIfExists('public_map_feedbacks');
    }
}
