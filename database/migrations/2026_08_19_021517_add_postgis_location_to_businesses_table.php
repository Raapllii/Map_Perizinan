<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddPostgisLocationToBusinessesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Enable PostGIS extension
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis;');

        // Add geometry column for location
        DB::statement('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);');

        // Migrate existing lat/lng data safely
        DB::statement('
            UPDATE businesses 
            SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326) 
            WHERE lat IS NOT NULL AND lng IS NOT NULL 
              AND lat BETWEEN -90 AND 90 
              AND lng BETWEEN -180 AND 180;
        ');

        // Create GiST spatial index
        DB::statement('CREATE INDEX IF NOT EXISTS businesses_location_gist ON businesses USING GIST (location);');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('DROP INDEX IF EXISTS businesses_location_gist;');
        DB::statement('ALTER TABLE businesses DROP COLUMN IF EXISTS location;');
    }
}
