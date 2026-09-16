<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class RecreateBusinessIndicatorsAsRelationalTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Drop old global configuration table if exists
        Schema::dropIfExists('business_indicators');

        // 2. Create new per-business relational table
        Schema::create('business_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->onDelete('cascade');
            $table->string('judul', 255);
            $table->text('nilai')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['business_id', 'sort_order']);
        });

        // 3. Migrate existing data from businesses.indicator_1 .. indicator_10 safely
        if (Schema::hasColumn('businesses', 'indicator_1')) {
            $businesses = DB::table('businesses')
                ->select(
                    'id',
                    'indicator_1', 'indicator_2', 'indicator_3', 'indicator_4', 'indicator_5',
                    'indicator_6', 'indicator_7', 'indicator_8', 'indicator_9', 'indicator_10'
                )
                ->where(function ($q) {
                    for ($i = 1; $i <= 10; $i++) {
                        $q->orWhereNotNull("indicator_{$i}");
                    }
                })
                ->get();

            $now = now();
            foreach ($businesses as $b) {
                for ($i = 1; $i <= 10; $i++) {
                    $val = $b->{"indicator_{$i}"};
                    if ($val !== null && trim((string)$val) !== '') {
                        DB::table('business_indicators')->insert([
                            'business_id' => $b->id,
                            'judul' => "Indikator {$i}",
                            'nilai' => (string)$val,
                            'sort_order' => $i,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('business_indicators');
    }
}
