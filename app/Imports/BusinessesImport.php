<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Carbon\Carbon;

class BusinessesImport implements ToCollection, WithHeadingRow, WithChunkReading, WithCustomCsvSettings
{
    public $importedCount = 0;
    public $updatedCount = 0;
    public $failedCount = 0;

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) {
            return;
        }

        // --- 1. HEADER VALIDATION ---
        // Get the actual keys from the first parsed row (they are automatically slugged by Maatwebsite Excel)
        $firstRowKeys = array_keys($rows->first()->toArray());
        
        $expectedSluggedHeaders = [
            'id_proyek',
            'uraian_jenis_proyek',
            'nib',
            'nama_perusahaan',
            'tanggal_terbit_oss',
            'uraian_status_penanaman_modal',
            'uraian_jenis_perusahaan',
            'uraian_risiko_proyek',
            'nama_proyek',
            'uraian_skala_usaha',
            'alamat_usaha',
            'kab_kota_usaha',
            'kecamatan_usaha',
            'kelurahan_usaha',
            'longitude',
            'latitude',
            'day_of_tanggal_pengajuan_proyek',
            'kbli',
            'judul_kbli',
            'kl_sektor_pembina',
            'nama_user',
            'email',
            'nomor_telp',
            'luas_tanah',
            'satuan_tanah',
            'jumlah_investasi',
            'tki'
        ];

        $missing = array_diff($expectedSluggedHeaders, $firstRowKeys);
        $unexpected = array_diff($firstRowKeys, $expectedSluggedHeaders);

        if (!empty($missing) || !empty($unexpected)) {
            $errorMessage = "Format CSV tidak sesuai.\n";
            if (!empty($missing)) {
                $errorMessage .= "Kolom yang hilang: " . implode(', ', $missing) . ".\n";
            }
            if (!empty($unexpected)) {
                $errorMessage .= "Kolom yang tidak dikenali/salah nama: " . implode(', ', $unexpected) . ".\n";
            }
            throw new \Exception($errorMessage);
        }
        // --- END HEADER VALIDATION ---

        $batch = []; // This will be an associative array keyed by 'nib|id_proyek'
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
                $idProyek = isset($row['id_proyek']) ? trim((string) $row['id_proyek']) : null;
                $nib = isset($row['nib']) ? trim((string) $row['nib']) : null;

                if (empty($idProyek) || empty($nib)) {
                    $fails++;
                    Log::warning("Import failed: Missing id_proyek or nib", ['row' => $row->toArray()]);
                    continue;
                }

                $tglTerbit = null;
                if (!empty($row['tanggal_terbit_oss'])) {
                    if (is_numeric($row['tanggal_terbit_oss'])) {
                        $tglTerbit = Date::excelToDateTimeObject($row['tanggal_terbit_oss'])->format('Y-m-d');
                    } else {
                        try {
                            $tglTerbit = Carbon::parse($row['tanggal_terbit_oss'])->format('Y-m-d');
                        } catch (\Exception $e) {
                            $tglTerbit = null;
                        }
                    }
                }

                $lat = null;
                if (isset($row['latitude']) && is_numeric($row['latitude'])) {
                    $lat = (float) $row['latitude'];
                    if ($lat < -90 || $lat > 90) {
                        $lat = null; // Invalid latitude
                    }
                }
                
                $lng = null;
                if (isset($row['longitude']) && is_numeric($row['longitude'])) {
                    $lng = (float) $row['longitude'];
                    if ($lng < -180 || $lng > 180) {
                        $lng = null; // Invalid longitude
                    }
                }
                
                $parseDecimal = function($val) {
                    if (empty($val)) return null;
                    $val = preg_replace('/[^0-9\.\-]/', '', $val);
                    return is_numeric($val) ? (float) $val : null;
                };

                $data = [
                    'id_proyek' => $idProyek,
                    'uraian_jenis_proyek' => $row['uraian_jenis_proyek'] ?? null,
                    'nib' => $nib,
                    'nama_perusahaan' => $row['nama_perusahaan'] ?? null,
                    'tanggal_terbit_oss' => $tglTerbit,
                    'uraian_status_penanaman_modal' => $row['uraian_status_penanaman_modal'] ?? null,
                    'uraian_jenis_perusahaan' => $row['uraian_jenis_perusahaan'] ?? null,
                    'uraian_risiko_proyek' => $row['uraian_risiko_proyek'] ?? null,
                    'nama_proyek' => $row['nama_proyek'] ?? null,
                    'uraian_skala_usaha' => $row['uraian_skala_usaha'] ?? null,
                    'alamat_usaha' => $row['alamat_usaha'] ?? null,
                    'kab_kota_usaha' => $row['kab_kota_usaha'] ?? null,
                    'kecamatan_usaha' => $row['kecamatan_usaha'] ?? null,
                    'kelurahan_usaha' => $row['kelurahan_usaha'] ?? null,
                    'longitude' => $lng,
                    'latitude' => $lat,
                    'day_of_tanggal_pengajuan_proyek' => $row['day_of_tanggal_pengajuan_proyek'] ?? null,
                    'kbli' => $row['kbli'] ?? null,
                    'judul_kbli' => $row['judul_kbli'] ?? null,
                    'kl_sektor_pembina' => $row['kl_sektor_pembina'] ?? null,
                    'nama_user' => $row['nama_user'] ?? null,
                    'email' => $row['email'] ?? null,
                    'nomor_telp' => $row['nomor_telp'] ?? null,
                    'luas_tanah' => $parseDecimal($row['luas_tanah'] ?? null),
                    'satuan_tanah' => $row['satuan_tanah'] ?? null,
                    'jumlah_investasi' => $parseDecimal($row['jumlah_investasi'] ?? null),
                    'tki' => (int) ($row['tki'] ?? 0),

                    // Internal Columns
                    'status' => 'Aktif',
                    'color' => null, // Let map UI or color generation handle this if needed, or if provided in CSV
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $key = $nib . '|' . $idProyek;
                
                // Keep only the latest entry for each unique key to prevent PostgreSQL 'cannot affect row a second time' error
                $batch[$key] = $data;
                
                if (isset($existingKeys[$key])) {
                    $updates++;
                } else {
                    $inserts++;
                    $existingKeys[$key] = true; // Mark as existing for subsequent chunks
                }
            }

            if (!empty($batch)) {
                $uniqueBatch = array_values($batch);
                DB::table('businesses')->upsert(
                    $uniqueBatch,
                    ['nib', 'id_proyek'],
                    [
                        'uraian_jenis_proyek', 'nama_perusahaan', 'tanggal_terbit_oss', 
                        'uraian_status_penanaman_modal', 'uraian_jenis_perusahaan', 'uraian_risiko_proyek', 
                        'nama_proyek', 'uraian_skala_usaha', 'alamat_usaha', 'kab_kota_usaha', 
                        'kecamatan_usaha', 'kelurahan_usaha', 'longitude', 'latitude', 
                        'day_of_tanggal_pengajuan_proyek', 'kbli', 'judul_kbli', 'kl_sektor_pembina', 
                        'nama_user', 'email', 'nomor_telp', 'luas_tanah', 'satuan_tanah', 
                        'jumlah_investasi', 'tki', 'status', 'color', 'updated_at'
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
        return 500;
    }

    public function getCsvSettings(): array
    {
        return [
            'delimiter' => ';'
        ];
    }
}
