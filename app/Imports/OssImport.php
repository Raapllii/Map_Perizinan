<?php

namespace App\Imports;

use App\Models\Business;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Maatwebsite\Excel\Validators\Failure;

class OssImport implements ToModel, WithHeadingRow, WithChunkReading, WithBatchInserts, WithUpserts, SkipsOnError, SkipsOnFailure, WithCustomCsvSettings
{
    use SkipsErrors, SkipsFailures;

    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        // Simple mapping based on standard OSS Excel format.
        // Assume headers exist, adjust defaults if missing
        
        $nib = $row['nib'] ?? $row['nomor_induk_berusaha'] ?? null;
        if (empty($nib)) {
            return null; // Skip rows without NIB
        }
        
        return new Business([
            'id_proyek'       => $row['id_proyek'] ?? $row['proyek_id'] ?? null,
            'nib'             => $nib,
            'nama_perusahaan' => $row['nama_perusahaan'] ?? $row['nama_usaha'] ?? 'Unknown',
            'uraian_risiko_proyek' => $row['uraian_risiko_proyek'] ?? $row['risiko'] ?? $row['kd_resiko'] ?? null,
            'kbli'            => $row['kbli'] ?? null,
            'judul_kbli'      => $row['judul_kbli'] ?? $row['kategori'] ?? null,
            'alamat_usaha'    => $row['alamat_usaha'] ?? $row['alamat_proyek'] ?? $row['alamat'] ?? null,
            'kecamatan_usaha' => $row['kecamatan_usaha'] ?? $row['kecamatan'] ?? null,
            'kelurahan_usaha' => $row['kelurahan_usaha'] ?? $row['kelurahan'] ?? null,
            'uraian_status_penanaman_modal' => $row['uraian_status_penanaman_modal'] ?? $row['status_pm'] ?? null,
            'tanggal_terbit_oss' => isset($row['tanggal_terbit_oss']) ? \Carbon\Carbon::parse(str_replace('/', '-', $row['tanggal_terbit_oss']))->format('Y-m-d') : (isset($row['tgl_terbit']) ? \Carbon\Carbon::parse($row['tgl_terbit'])->format('Y-m-d') : null),
            'latitude'        => isset($row['latitude']) && $row['latitude'] !== '' ? (float) $row['latitude'] : (isset($row['lat']) && $row['lat'] !== '' ? (float) $row['lat'] : null),
            'longitude'       => isset($row['longitude']) && $row['longitude'] !== '' ? (float) $row['longitude'] : (isset($row['lng']) && $row['lng'] !== '' ? (float) $row['lng'] : null),
            'status'          => 'Aktif',
            'color'           => '#2E7D32',
        ]);
    }
    
    public function getCsvSettings(): array
    {
        return [
            'delimiter' => ';'
        ];
    }
    
    public function uniqueBy()
    {
        // Upsert unique constraint (matches unique(['nib', 'id_proyek']) in migration)
        return ['nib', 'id_proyek'];
    }

    public function batchSize(): int
    {
        return 500;
    }

    public function chunkSize(): int
    {
        return 1000;
    }
}
