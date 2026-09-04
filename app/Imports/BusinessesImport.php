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
    public $processedRows = 0;

    protected $importId;
    protected $delimiter;
    protected $headerValidated = false;

    public const CANONICAL_HEADERS = [
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

    public function __construct($importId = null, $delimiter = ';')
    {
        $this->importId = $importId;
        $this->delimiter = $delimiter ?: ';';
    }

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) {
            return;
        }

        // --- 1. HEADER VALIDATION (ON FIRST CHUNK) ---
        if (!$this->headerValidated) {
            $firstRow = $rows->first();
            $firstRowArray = is_array($firstRow) ? $firstRow : $firstRow->toArray();
            $firstRowKeys = array_keys($firstRowArray);

            $foundCanonicalHeaders = [];
            foreach ($firstRowKeys as $key) {
                $norm = $this->normalizeKey($key);
                if (in_array($norm, self::CANONICAL_HEADERS)) {
                    $foundCanonicalHeaders[] = $norm;
                }
            }

            $missing = array_diff(self::CANONICAL_HEADERS, $foundCanonicalHeaders);

            if (!empty($missing)) {
                $missingStr = implode(', ', $missing);
                throw new \Exception("Format file tidak sesuai. Kolom wajib yang tidak ditemukan: {$missingStr}.");
            }

            $this->headerValidated = true;
        }

        // --- 2. BATCH PROCESSING ---
        $batch = [];
        $now = now();
        $existingKeys = [];

        // Preload existing NIB + ID_PROYEK for accurate insert/update counting
        $nibs = [];
        $idProyeks = [];

        foreach ($rows as $row) {
            $rowArray = is_array($row) ? $row : $row->toArray();
            $normRow = [];
            foreach ($rowArray as $k => $v) {
                $normRow[$this->normalizeKey($k)] = $v;
            }

            $nib = isset($normRow['nib']) ? trim((string) $normRow['nib']) : null;
            $idProyek = isset($normRow['id_proyek']) ? trim((string) $normRow['id_proyek']) : null;

            if (!empty($nib) && !empty($idProyek)) {
                $nibs[] = $nib;
                $idProyeks[] = $idProyek;
            }
        }

        if (!empty($nibs) && !empty($idProyeks)) {
            $existingRecords = DB::table('businesses')
                ->whereIn('nib', array_unique($nibs))
                ->whereIn('id_proyek', array_unique($idProyeks))
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
                $rowArray = is_array($row) ? $row : $row->toArray();
                $normRow = [];
                foreach ($rowArray as $k => $v) {
                    $normRow[$this->normalizeKey($k)] = $v;
                }

                $idProyek = isset($normRow['id_proyek']) ? trim((string) $normRow['id_proyek']) : null;
                $nib = isset($normRow['nib']) ? trim((string) $normRow['nib']) : null;

                if (empty($idProyek) || empty($nib)) {
                    $fails++;
                    continue;
                }

                $tglTerbit = $this->parseDate($normRow['tanggal_terbit_oss'] ?? null);

                $lat = null;
                if (isset($normRow['latitude']) && is_numeric($normRow['latitude'])) {
                    $lat = (float) $normRow['latitude'];
                    if ($lat < -90 || $lat > 90) {
                        $lat = null;
                    }
                }

                $lng = null;
                if (isset($normRow['longitude']) && is_numeric($normRow['longitude'])) {
                    $lng = (float) $normRow['longitude'];
                    if ($lng < -180 || $lng > 180) {
                        $lng = null;
                    }
                }

                $data = [
                    'id_proyek' => $idProyek,
                    'uraian_jenis_proyek' => $normRow['uraian_jenis_proyek'] ?? null,
                    'nib' => $nib,
                    'nama_perusahaan' => $normRow['nama_perusahaan'] ?? null,
                    'tanggal_terbit_oss' => $tglTerbit,
                    'uraian_status_penanaman_modal' => $normRow['uraian_status_penanaman_modal'] ?? null,
                    'uraian_jenis_perusahaan' => $normRow['uraian_jenis_perusahaan'] ?? null,
                    'uraian_risiko_proyek' => $normRow['uraian_risiko_proyek'] ?? null,
                    'nama_proyek' => $normRow['nama_proyek'] ?? null,
                    'uraian_skala_usaha' => $normRow['uraian_skala_usaha'] ?? null,
                    'alamat_usaha' => $normRow['alamat_usaha'] ?? null,
                    'kab_kota_usaha' => $normRow['kab_kota_usaha'] ?? null,
                    'kecamatan_usaha' => $normRow['kecamatan_usaha'] ?? null,
                    'kelurahan_usaha' => $normRow['kelurahan_usaha'] ?? null,
                    'longitude' => $lng,
                    'latitude' => $lat,
                    'day_of_tanggal_pengajuan_proyek' => $normRow['day_of_tanggal_pengajuan_proyek'] ?? null,
                    'kbli' => $normRow['kbli'] ?? null,
                    'judul_kbli' => $normRow['judul_kbli'] ?? null,
                    'kl_sektor_pembina' => $normRow['kl_sektor_pembina'] ?? null,
                    'nama_user' => $normRow['nama_user'] ?? null,
                    'email' => $normRow['email'] ?? null,
                    'nomor_telp' => $normRow['nomor_telp'] ?? null,
                    'luas_tanah' => $this->parseDecimal($normRow['luas_tanah'] ?? null),
                    'satuan_tanah' => $normRow['satuan_tanah'] ?? null,
                    'jumlah_investasi' => $this->parseDecimal($normRow['jumlah_investasi'] ?? null),
                    'tki' => isset($normRow['tki']) ? (int) $normRow['tki'] : null,

                    'status' => 'Aktif',
                    'color' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $key = $nib . '|' . $idProyek;
                $batch[$key] = $data;

                if (isset($existingKeys[$key])) {
                    $updates++;
                } else {
                    $inserts++;
                    $existingKeys[$key] = true;
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
            $this->processedRows += count($rows);

            // Update Progress in Cache
            if ($this->importId) {
                $progress = Cache::get('import_progress_' . $this->importId);
                if ($progress) {
                    $totalRows = $progress['total_rows'] ?? 0;
                    $startedAt = $progress['started_at'] ?? microtime(true);
                    $elapsed = max(0.1, microtime(true) - $startedAt);
                    $speed = $this->processedRows / $elapsed;
                    $remainingRows = max(0, $totalRows - $this->processedRows);
                    $eta = $speed > 0 ? $remainingRows / $speed : 0;

                    $percentage = $totalRows > 0 
                        ? min(99, (int) round(($this->processedRows / $totalRows) * 100))
                        : 0;

                    $progress['processed_rows'] = $this->processedRows;
                    $progress['percentage'] = $percentage;
                    $progress['elapsed_seconds'] = round($elapsed);
                    $progress['rows_per_second'] = round($speed);
                    $progress['estimated_remaining_seconds'] = round($eta);
                    $progress['imported'] = $this->importedCount;
                    $progress['updated'] = $this->updatedCount;
                    $progress['failed'] = $this->failedCount;
                    $progress['message'] = "Mengimport data... (" . number_format($this->processedRows, 0, ',', '.') . " / " . number_format($totalRows, 0, ',', '.') . " data)";

                    Cache::put('import_progress_' . $this->importId, $progress, 3600);
                }
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Import batch error: " . $e->getMessage());
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
            'delimiter' => $this->delimiter
        ];
    }

    public function normalizeKey(string $key): string
    {
        // Remove UTF-8 BOM if present
        $key = preg_replace('/^\xEF\xBB\xBF/', '', $key);
        $norm = trim(strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $key)), '_');

        if ($norm === 'klsektor_pembina' || $norm === 'klsektorpembina') {
            return 'kl_sektor_pembina';
        }

        return $norm;
    }

    public function parseDate($val): ?string
    {
        if (empty($val)) {
            return null;
        }

        if (is_numeric($val)) {
            try {
                return Date::excelToDateTimeObject($val)->format('Y-m-d');
            } catch (\Exception $e) {
                // fallback
            }
        }

        $str = trim((string) $val);

        // Indonesian date format: d/m/Y or d-m-Y (e.g. 18/11/2019)
        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $str, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }

        try {
            return Carbon::parse($str)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    public function parseDecimal($val): ?float
    {
        if ($val === null || $val === '') {
            return null;
        }
        if (is_numeric($val)) {
            return (float) $val;
        }

        $str = trim((string) $val);
        $str = preg_replace('/[^\d\,\.\-]/', '', $str);

        if (empty($str)) {
            return null;
        }

        // Indonesian currency/number: 10.000.000,50
        if (strpos($str, '.') !== false && strpos($str, ',') !== false) {
            if (strrpos($str, ',') > strrpos($str, '.')) {
                $str = str_replace('.', '', $str);
                $str = str_replace(',', '.', $str);
            } else {
                $str = str_replace(',', '', $str);
            }
        } elseif (strpos($str, '.') !== false) {
            $parts = explode('.', $str);
            if (count($parts) > 2) {
                $str = str_replace('.', '', $str);
            } elseif (count($parts) === 2 && strlen($parts[1]) === 3) {
                $str = str_replace('.', '', $str);
            }
        } elseif (strpos($str, ',') !== false) {
            $str = str_replace(',', '.', $str);
        }

        return is_numeric($str) ? (float) $str : null;
    }
}
