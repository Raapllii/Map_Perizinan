<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RingkasanRekapitulasiSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    protected array $summary;

    public function __construct(array $summary)
    {
        $this->summary = $summary;
    }

    public function title(): string
    {
        return 'Ringkasan Rekapitulasi';
    }

    public function array(): array
    {
        $gender = $this->summary['gender'];
        $risks = $this->summary['risks'] ?? [];
        $totalAll = (int) ($gender['total'] ?? 0);
        $totalValid = (int) ($gender['total_valid'] ?? 0);
        $laki = (int) ($gender['laki_laki'] ?? 0);
        $perempuan = (int) ($gender['perempuan'] ?? 0);
        $unknown = (int) ($gender['tidak_diketahui'] ?? 0);

        $pctLakiValidDecimal = $totalValid > 0 ? ($laki / $totalValid) : 0.0;
        $pctPerempuanValidDecimal = $totalValid > 0 ? ($perempuan / $totalValid) : 0.0;

        $pctLakiTotalDecimal = $totalAll > 0 ? ($laki / $totalAll) : 0.0;
        $pctPerempuanTotalDecimal = $totalAll > 0 ? ($perempuan / $totalAll) : 0.0;
        $pctUnknownTotalDecimal = $totalAll > 0 ? ($unknown / $totalAll) : 0.0;

        $sudahDipetakan = (int) ($this->summary['sudah_dipetakan'] ?? 0);
        $belumDipetakan = (int) ($this->summary['belum_dipetakan'] ?? 0);

        $rows = [
            // Row 1: Title Banner
            ['REKAPITULASI DATA PERIZINAN', '', '', ''],
            // Row 2: Subtitle Banner
            ['Dashboard Map Perizinan — Sistem Informasi Geografis Perizinan Usaha', '', '', ''],
            // Row 3: Blank spacer
            ['', '', '', ''],
            // Row 4-7: Metadata block
            ['Nama Aplikasi', 'Dashboard Map Perizinan', 'Filter Tahun', $this->summary['filter_year_label'] ?? 'Semua Tahun'],
            ['Tanggal & Waktu Ekspor', $this->summary['exported_at'] ?? '-', 'Filter Wilayah', $this->summary['filter_location_label'] ?? 'Semua Wilayah'],
            ['Filter Status / Risiko', $this->summary['filter_status_label'] ?? 'Semua Status & Risiko', 'Pencarian Kata Kunci', $this->summary['filter_search_label'] ?? '-'],
            ['', '', '', ''],

            // Row 8: Section 1 Header
            ['I. RINGKASAN REKAPITULASI UTAMA & GENDER', '', '', ''],
            // Row 9: Table 1 Columns
            ['Indikator Rekapitulasi', 'Jumlah Data', 'Persentase (Data Valid)', 'Persentase (Total Data)'],
            // Row 10-15: Data rows
            ['Total Keseluruhan Data Perizinan', $totalAll, '-', $totalAll > 0 ? 1.0 : 0.0],
            ['Total Data Gender Valid (Terisi)', $totalValid, $totalValid > 0 ? 1.0 : 0.0, $totalAll > 0 ? ($totalValid / $totalAll) : 0.0],
            ['Total Laki-laki', $laki, $pctLakiValidDecimal, $pctLakiTotalDecimal],
            ['Total Perempuan', $perempuan, $pctPerempuanValidDecimal, $pctPerempuanTotalDecimal],
            ['Total Gender Belum Diisi / Tidak Diketahui', $unknown, '-', $pctUnknownTotalDecimal],
            ['Total Usaha Sudah Dipetakan (Koordinat Valid)', $sudahDipetakan, '-', $totalAll > 0 ? ($sudahDipetakan / $totalAll) : 0.0],
            ['Total Usaha Belum Dipetakan', $belumDipetakan, '-', $totalAll > 0 ? ($belumDipetakan / $totalAll) : 0.0],
            // Row 17: Blank spacer
            ['', '', '', ''],

            // Row 18: Section 2 Header
            ['II. RINGKASAN BERDASARKAN TINGKAT RISIKO PROYEK', '', '', ''],
            // Row 19: Table 2 Columns
            ['Kategori Risiko Proyek', 'Jumlah Usaha', 'Status Kategori', 'Persentase Terhadap Total'],
        ];

        foreach ($risks as $risk) {
            $rVal = (int) ($risk['value'] ?? 0);
            $rPct = $totalAll > 0 ? ($rVal / $totalAll) : 0.0;
            $rows[] = [
                $risk['name'] ?? 'Tidak Diisi',
                $rVal,
                ($risk['name'] ?? '') === 'Tidak Diisi' ? 'Belum Diisi' : 'Klasifikasi Risiko OSS',
                $rPct,
            ];
        }

        // Total row for Risk table
        $rows[] = [
            'Total Keseluruhan',
            $totalAll,
            'Akumulasi Seluruh Kategori Risiko',
            $totalAll > 0 ? 1.0 : 0.0,
        ];

        return $rows;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 44,
            'B' => 28,
            'C' => 28,
            'D' => 28,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getPageSetup()
            ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
            ->setPaperSize(PageSetup::PAPERSIZE_A4)
            ->setFitToWidth(1)
            ->setFitToHeight(0);

        $sheet->setShowGridlines(true);

        // Merge title & subtitle banners
        $sheet->mergeCells('A1:D1');
        $sheet->mergeCells('A2:D2');
        $sheet->mergeCells('A8:D8');
        $sheet->mergeCells('A18:D18');

        // Base font
        $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        // Row heights
        $sheet->getRowDimension(1)->setRowHeight(30);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(8)->setRowHeight(24);
        $sheet->getRowDimension(9)->setRowHeight(24);
        $sheet->getRowDimension(18)->setRowHeight(24);
        $sheet->getRowDimension(19)->setRowHeight(24);

        // Banner styling
        $sheet->getStyle('A1:D1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 15, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '285E3B']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        $sheet->getStyle('A2:D2')->applyFromArray([
            'font' => ['bold' => false, 'size' => 10, 'color' => ['rgb' => 'E2F1E7']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        // Metadata box (Rows 4-6)
        $sheet->getStyle('A4:D6')->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);
        $sheet->getStyle('A4:A6')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
        ]);
        $sheet->getStyle('C4:C6')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
        ]);
        for ($r = 4; $r <= 6; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(20);
        }

        // Section 1 Header (Row 8)
        $sheet->getStyle('A8:D8')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        // Table 1 Header (Row 9)
        $sheet->getStyle('A9:D9')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '285E3B']],
            ],
        ]);
        $sheet->getStyle('A9')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Table 1 Body (Rows 10-16)
        $sheet->getStyle('A10:D16')->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        for ($r = 10; $r <= 16; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(21);
            if ($r % 2 === 1) {
                $sheet->getStyle("A{$r}:D{$r}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('F8FAF9');
            }
        }

        // Emphasize Row 10 (Total Keseluruhan Data)
        $sheet->getStyle('A10:D10')->getFont()->setBold(true);
        $sheet->getStyle('B10:B16')->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('B10:B16')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('C10:D16')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        // Format percentages in Table 1 where numeric
        foreach (range(10, 16) as $r) {
            foreach (['C', 'D'] as $col) {
                $val = $sheet->getCell("{$col}{$r}")->getValue();
                if (is_numeric($val)) {
                    $sheet->getStyle("{$col}{$r}")->getNumberFormat()->setFormatCode('0.0%');
                } else {
                    $sheet->getStyle("{$col}{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }
            }
        }

        // Section 2 Header (Row 18)
        $sheet->getStyle('A18:D18')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        // Table 2 Header (Row 19)
        $sheet->getStyle('A19:D19')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '285E3B']],
            ],
        ]);
        $sheet->getStyle('A19')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= 20) {
            $sheet->getStyle("A20:D{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
                ],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);

            for ($r = 20; $r <= $highestRow; $r++) {
                $sheet->getRowDimension($r)->setRowHeight(21);
                if ($r < $highestRow && $r % 2 === 1) {
                    $sheet->getStyle("A{$r}:D{$r}")->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('F8FAF9');
                }
            }

            $sheet->getStyle("B20:B{$highestRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("B20:B{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("C20:C{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D20:D{$highestRow}")->getNumberFormat()->setFormatCode('0.0%');
            $sheet->getStyle("D20:D{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            // Footer total row on Table 2
            $sheet->getStyle("A{$highestRow}:D{$highestRow}")->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => '1E3A29']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '367D50']],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE, 'color' => ['rgb' => '367D50']],
                ],
            ]);
        }

        $sheet->freezePane('A10');

        return [];
    }
}

