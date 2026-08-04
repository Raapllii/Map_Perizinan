<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Carbon\Carbon;

class BusinessesImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    public $importedCount = 0;
    public $updatedCount = 0;
    public $failedCount = 0;

    public function collection(Collection $rows)
    {
        $batch = [];
        $now = now();
        
        $existingKeys = [];
        
        $nibs = $rows->pluck('nib')->filter()->toArray();
        $idProyeks = $rows->pluck('id_proyek')->filter()->toArray();
        
        if (!empty($nibs) && !empty($idProyeks)) {
            $existingRecords = DB::table('businesses')
                ->whereIn('nib', $nibs)
                ->whereIn('id_proyek', $idProyeks)
                ->get(['nib', 'id_proyek']);
                
            foreach ($existingRecords as $record) {
                $existingKeys[$record->nib . '|' . $record->id_proyek] = true;
            }
        }
        
        $inserts = 0;
        $updates = 0;
        $fails = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $idProyek = $row['id_proyek'] ?? null;
                $nib = $row['nib'] ?? null;

                if (empty($idProyek) || empty($nib)) {
                    $fails++;
                    Log::warning("Import failed: Missing id_proyek or nib", ['row' => $row->toArray()]);
                    continue;
                }

                $tglTerbit = null;
                if (!empty($row['tgl_terbit'])) {
                    if (is_numeric($row['tgl_terbit'])) {
                        $tglTerbit = Date::excelToDateTimeObject($row['tgl_terbit'])->format('Y-m-d');
                    } else {
                        try {
                            $tglTerbit = Carbon::parse($row['tgl_terbit'])->format('Y-m-d');
                        } catch (\Exception $e) {
                            $tglTerbit = null;
                        }
                    }
                }

                $lat = null;
                if (isset($row['lat']) && is_numeric($row['lat'])) {
                    $lat = (float) $row['lat'];
                }
                
                $lng = null;
                if (isset($row['lng']) && is_numeric($row['lng'])) {
                    $lng = (float) $row['lng'];
                }

                $data = [
                    'id_proyek' => $idProyek,
                    'nib' => $nib,
                    'nama_perusahaan' => $row['nama_perusahaan'] ?? null,
                    'risiko' => $row['risiko'] ?? null,
                    'kbli' => $row['kbli'] ?? null,
                    'judul_kbli' => $row['judul_kbli'] ?? null,
                    'alamat_proyek' => $row['alamat_proyek'] ?? null,
                    'kecamatan' => $row['kecamatan'] ?? null,
                    'kelurahan' => $row['kelurahan'] ?? null,
                    'status_pm' => $row['status_pm'] ?? null,
                    'status' => $row['status'] ?? 'Aktif',
                    'tgl_terbit' => $tglTerbit,
                    'lat' => $lat,
                    'lng' => $lng,
                    'color' => $row['color'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $batch[] = $data;
                
                $key = $nib . '|' . $idProyek;
                if (isset($existingKeys[$key])) {
                    $updates++;
                } else {
                    $inserts++;
                    $existingKeys[$key] = true; 
                }
            }

            if (!empty($batch)) {
                DB::table('businesses')->upsert(
                    $batch,
                    ['nib', 'id_proyek'],
                    [
                        'nama_perusahaan', 'risiko', 'kbli', 'judul_kbli', 'alamat_proyek',
                        'kecamatan', 'kelurahan', 'status_pm', 'status', 'tgl_terbit',
                        'lat', 'lng', 'color', 'updated_at'
                    ]
                );
            }
            DB::commit();

            $this->importedCount += $inserts;
            $this->updatedCount += $updates;
            $this->failedCount += $fails;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Import batch failed", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function chunkSize(): int
    {
        return 1000;
    }
}
