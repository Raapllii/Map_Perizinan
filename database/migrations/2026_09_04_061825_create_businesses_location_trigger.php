<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class CreateBusinessesLocationTrigger extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Create the function
        DB::unprepared("
            CREATE OR REPLACE FUNCTION set_location_from_latlng()
            RETURNS trigger AS $$
            BEGIN
                -- Cek apakah latitude dan longitude tidak null
                IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
                    -- Validasi range koordinat geografis
                    IF NEW.latitude >= -90 AND NEW.latitude <= 90 AND 
                       NEW.longitude >= -180 AND NEW.longitude <= 180 THEN
                        -- Jika valid, set location POINT
                        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
                    ELSE
                        -- Jika di luar range, biarkan location NULL (tidak valid)
                        NEW.location := NULL;
                    END IF;
                ELSE
                    NEW.location := NULL;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");

        // 2. Create the trigger
        DB::unprepared("
            DROP TRIGGER IF EXISTS trg_businesses_location ON businesses;
            CREATE TRIGGER trg_businesses_location
            BEFORE INSERT OR UPDATE OF latitude, longitude
            ON businesses
            FOR EACH ROW
            EXECUTE FUNCTION set_location_from_latlng();
        ");
        
        // 3. Update existing records
        DB::unprepared("
            UPDATE businesses 
            SET location = CASE
                WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
                     AND latitude >= -90 AND latitude <= 90
                     AND longitude >= -180 AND longitude <= 180
                THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
                ELSE NULL
            END;
        ");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::unprepared("DROP TRIGGER IF EXISTS trg_businesses_location ON businesses;");
        DB::unprepared("DROP FUNCTION IF EXISTS set_location_from_latlng();");
    }
}
