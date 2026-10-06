<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePublicMapServiceSurveysTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('public_map_service_surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('public_map_access_log_id')->constrained('public_map_access_logs')->cascadeOnDelete();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->unsignedInteger('total_score')->default(0);
            $table->decimal('average_score', 4, 2)->default(0);
            $table->timestamps();

            $table->index(['business_id', 'created_at']);
            $table->index(['public_map_access_log_id']);
        });

        Schema::create('public_map_service_survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained('public_map_service_surveys')->cascadeOnDelete();
            $table->foreignId('public_map_access_log_id')->constrained('public_map_access_logs')->cascadeOnDelete();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('indicator_key', 50);
            $table->string('indicator_name', 150);
            $table->text('question');
            $table->string('answer_label', 100);
            $table->unsignedTinyInteger('score');
            $table->timestamps();

            $table->index(['indicator_key', 'score']);
            $table->index(['business_id']);
            $table->index(['survey_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('public_map_service_survey_responses');
        Schema::dropIfExists('public_map_service_surveys');
    }
}
