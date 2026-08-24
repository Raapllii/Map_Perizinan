<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUserAndBusinessFieldsToActivityLogsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->unsignedBigInteger('business_id')->nullable();
            $table->string('business_name')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('note')->nullable();
            
            // Drop NOT NULL constraint using raw SQL to avoid doctrine/dbal dependency
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE activity_logs ALTER COLUMN "time" DROP NOT NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE activity_logs ALTER COLUMN "name" DROP NOT NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE activity_logs ALTER COLUMN "status_type" DROP NOT NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE activity_logs ALTER COLUMN "action" DROP NOT NULL');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn([
                'user_id', 'user_name', 'business_id', 'business_name', 
                'old_status', 'new_status', 'note'
            ]);
        });
    }
}
