<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;

class BusinessesExport extends DefaultValueBinder implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle, WithCustomValueBinder, WithColumnFormatting
{
    protected $query;

    public function __construct($query)
    {
        $this->query = $query;
    }

    public function query()
    {
        return $this->query;
    }

    public function title(): string
    {
        return 'Data Usaha';
    }

    public function headings(): array
    {
        return [
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
            'tki',
        ];
    }

    private function parseExcelDate($value)
    {
        if (empty($value)) return null;
        try {
            return Date::dateTimeToExcel(\Carbon\Carbon::parse($value));
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function map($business): array
    {
        return [
            $business->id_proyek,
            $business->uraian_jenis_proyek,
            $business->nib,
            $business->nama_perusahaan,
            $this->parseExcelDate($business->tanggal_terbit_oss),
            $business->uraian_status_penanaman_modal,
            $business->uraian_jenis_perusahaan,
            $business->uraian_risiko_proyek,
            $business->nama_proyek,
            $business->uraian_skala_usaha,
            $business->alamat_usaha,
            $business->kab_kota_usaha,
            $business->kecamatan_usaha,
            $business->kelurahan_usaha,
            $business->longitude !== null ? (float) $business->longitude : null,
            $business->latitude !== null ? (float) $business->latitude : null,
            $this->parseExcelDate($business->day_of_tanggal_pengajuan_proyek),
            $business->kbli,
            $business->judul_kbli,
            $business->kl_sektor_pembina,
            $business->nama_user,
            $business->email,
            $business->nomor_telp,
            $business->luas_tanah !== null ? (float) $business->luas_tanah : null,
            $business->satuan_tanah,
            $business->jumlah_investasi !== null ? (float) $business->jumlah_investasi : null,
            $business->tki !== null ? (int) $business->tki : null,
        ];
    }

    public function bindValue(Cell $cell, $value)
    {
        // For strictly string columns like ID Proyek (A), NIB (C), KBLI (R), Nomor Telp (W)
        if (in_array($cell->getColumn(), ['A', 'C', 'R', 'W']) && $value !== null) {
            $cell->setValueExplicit((string)$value, DataType::TYPE_STRING);
            return true;
        }

        if (is_numeric($value)) { 
            $cell->setValueExplicit($value, DataType::TYPE_NUMERIC);
            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:AA1')->applyFromArray([
            'font' => [
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);

        $sheet->setAutoFilter('A1:AA1');
        $sheet->freezePane('A2');

        $highestRow = $sheet->getHighestRow();
        if ($highestRow > 1) {
            $sheet->getStyle('A2:AA' . $highestRow)->getAlignment()->setWrapText(true);
            $sheet->getStyle('A2:AA' . $highestRow)->getAlignment()->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_TOP);
        }

        return [];
    }

    public function columnFormats(): array
    {
        return [
            'E' => 'yyyy-mm-dd',
            'Q' => 'yyyy-mm-dd',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 20,
            'B' => 25,
            'C' => 20,
            'D' => 35,
            'E' => 15,
            'F' => 25,
            'G' => 25,
            'H' => 20,
            'I' => 35,
            'J' => 20,
            'K' => 45,
            'L' => 20,
            'M' => 20,
            'N' => 20,
            'O' => 15,
            'P' => 15,
            'Q' => 15,
            'R' => 10,
            'S' => 40,
            'T' => 30,
            'U' => 25,
            'V' => 25,
            'W' => 20,
            'X' => 15,
            'Y' => 15,
            'Z' => 20,
            'AA'=> 10,
        ];
    }
}
