<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
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
    protected $importId;

    public function __construct($importId = null)
    {
        $this->importId = $importId;
    }

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) {
            return;
        }

        // --- 1. HEADER VALIDATION & NORMALIZATION ---
        $firstRowArray = is_array($rows->first()) ? $rows->first() : $rows->first()->toArray();
        $firstRowKeys = array_keys($firstRowArray);
        
        $canonicalHeaders = [
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

        $aliasMap = [
            'klsektor_pembina' => 'kl_sektor_pembina',
            'klsektorpembina' => 'kl_sektor_pembina'
        ];

        $headerMapping = []; // canonical_field => original_csv_column
        $foundCanonicalHeaders = [];

        foreach ($firstRowKeys as $key) {
            $normalizedKey = trim(strtolower($key));
            // normalisasi spasi dan karakter non-alfanumerik (termasuk /) menjadi underscore
            $normalizedKey = preg_replace('/[^a-z0-9]+/', '_', $normalizedKey);
            $normalizedKey = trim($normalizedKey, '_');
            
            if (in_array($normalizedKey, $canonicalHeaders)) {
                $headerMapping[$normalizedKey] = $key;
                $foundCanonicalHeaders[] = $normalizedKey;
            } elseif (isset($aliasMap[$normalizedKey])) {
                $headerMapping[$aliasMap[$normalizedKey]] = $key;
                $foundCanonicalHeaders[] = $aliasMap[$normalizedKey];
            }
        }

        $missing = array_diff($canonicalHeaders, $foundCanonicalHeaders);

        if (!empty($missing)) {
            throw new \Exception("Format CSV tidak sesuai.\nKolom wajib yang hilang: " . implode(', ', $missing) . ".");
        }
        // --- END HEADER VALIDATION & NORMALIZATION ---

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
                // Map the original slugged keys to canonical keys
                $mappedRow = [];
                foreach ($canonicalHeaders as $canonical) {
                    $original = $headerMapping[$canonical] ?? null;
                    if ($original !== null) {
                        $mappedRow[$canonical] = $row[$original] ?? null;
                    } else {
                        $mappedRow[$canonical] = null;
                    }
                }

                $idProyek = isset($mappedRow['id_proyek']) ? trim((string) $mappedRow['id_proyek']) : null;
                $nib = isset($mappedRow['nib']) ? trim((string) $mappedRow['nib']) : null;

                if (empty($idProyek) || empty($nib)) {
                    $fails++;
                    Log::warning("Import failed: Missing id_proyek or nib", ['row' => (is_array($row) ? $row : $row->toArray())]);
                    continue;
                }
                
                // --- DEBUG MAPPING AS REQUESTED ---
                if (empty($mappedRow['nama_perusahaan'])) {
                    Log::info("Debug Mapping (Empty nama_perusahaan)", [
                        'original_row' => (is_array($row) ? $row : $row->toArray()),
                        'mapped_row' => $mappedRow,
                        'header_mapping' => $headerMapping,
                    ]);
                }
                // --- END DEBUG ---

                $tglTerbit = null;
                if (!empty($mappedRow['tanggal_terbit_oss'])) {
                    if (is_numeric($mappedRow['tanggal_terbit_oss'])) {
                        $tglTerbit = Date::excelToDateTimeObject($mappedRow['tanggal_terbit_oss'])->format('Y-m-d');
                    } else {
                        try {
                            $tglTerbit = Carbon::parse($mappedRow['tanggal_terbit_oss'])->format('Y-m-d');
                        } catch (\Exception $e) {
                            $tglTerbit = null;
                        }
                    }
                }

                $lat = null;
                if (isset($mappedRow['latitude']) && is_numeric($mappedRow['latitude'])) {
                    $lat = (float) $mappedRow['latitude'];
                    if ($lat < -90 || $lat > 90) {
                        $lat = null; // Invalid latitude
                    }
                }
                
                $lng = null;
                if (isset($mappedRow['longitude']) && is_numeric($mappedRow['longitude'])) {
                    $lng = (float) $mappedRow['longitude'];
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
                    'uraian_jenis_proyek' => $mappedRow['uraian_jenis_proyek'] ?? null,
                    'nib' => $nib,
                    'nama_perusahaan' => $mappedRow['nama_perusahaan'] ?? null,
                    'tanggal_terbit_oss' => $tglTerbit,
                    'uraian_status_penanaman_modal' => $mappedRow['uraian_status_penanaman_modal'] ?? null,
                    'uraian_jenis_perusahaan' => $mappedRow['uraian_jenis_perusahaan'] ?? null,
                    'uraian_risiko_proyek' => $mappedRow['uraian_risiko_proyek'] ?? null,
                    'nama_proyek' => $mappedRow['nama_proyek'] ?? null,
                    'uraian_skala_usaha' => $mappedRow['uraian_skala_usaha'] ?? null,
                    'alamat_usaha' => $mappedRow['alamat_usaha'] ?? null,
                    'kab_kota_usaha' => $mappedRow['kab_kota_usaha'] ?? null,
                    'kecamatan_usaha' => $mappedRow['kecamatan_usaha'] ?? null,
                    'kelurahan_usaha' => $mappedRow['kelurahan_usaha'] ?? null,
                    'longitude' => $lng,
                    'latitude' => $lat,
                    'day_of_tanggal_pengajuan_proyek' => $mappedRow['day_of_tanggal_pengajuan_proyek'] ?? null,
                    'kbli' => $mappedRow['kbli'] ?? null,
                    'judul_kbli' => $mappedRow['judul_kbli'] ?? null,
                    'kl_sektor_pembina' => $mappedRow['kl_sektor_pembina'] ?? null,
                    'nama_user' => $mappedRow['nama_user'] ?? null,
                    'email' => $mappedRow['email'] ?? null,
                    'nomor_telp' => $mappedRow['nomor_telp'] ?? null,
                    'luas_tanah' => $parseDecimal($mappedRow['luas_tanah'] ?? null),
                    'satuan_tanah' => $mappedRow['satuan_tanah'] ?? null,
                    'jumlah_investasi' => $parseDecimal($mappedRow['jumlah_investasi'] ?? null),
                    'tki' => (int) ($mappedRow['tki'] ?? 0),

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
            
            if ($this->importId) {
                $progress = Cache::get('import_progress_' . $this->importId);
                if ($progress) {
                    $progress['processed_rows'] += count($rows);
                    Cache::put('import_progress_' . $this->importId, $progress, 3600);
                }
            }

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
