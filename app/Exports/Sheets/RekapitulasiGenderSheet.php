<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RekapitulasiGenderSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    protected array $summary;

    public function __construct(array $summary)
    {
        $this->summary = $summary;
    }

    public function title(): string
    {
        return 'Rekapitulasi Gender';
    }

    public function array(): array
    {
        $gender = $this->summary['gender'];
        $totalAll = (int) ($gender['total'] ?? 0);
        $totalValid = (int) ($gender['total_valid'] ?? 0);
        $laki = (int) ($gender['laki_laki'] ?? 0);
        $perempuan = (int) ($gender['perempuan'] ?? 0);
        $unknown = (int) ($gender['tidak_diketahui'] ?? 0);

        $pctLakiValid = $totalValid > 0 ? ($laki / $totalValid) : 0.0;
        $pctPerempuanValid = $totalValid > 0 ? ($perempuan / $totalValid) : 0.0;

        $pctLakiTotal = $totalAll > 0 ? ($laki / $totalAll) : 0.0;
        $pctPerempuanTotal = $totalAll > 0 ? ($perempuan / $totalAll) : 0.0;
        $pctUnknownTotal = $totalAll > 0 ? ($unknown / $totalAll) : 0.0;
        $pctValidTotal = $totalAll > 0 ? ($totalValid / $totalAll) : 0.0;

        return [
            // Row 1: Title Banner
            ['REKAPITULASI DATA BERDASARKAN GENDER', '', '', '', '', ''],
            // Row 2: Subtitle Banner
            ['Dashboard Map Perizinan — Statistik Distribusi Jenis Kelamin', '', '', '', '', ''],
            // Row 3: Spacer
            ['', '', '', '', '', ''],
            // Row 4-5: Info
            ['Tanggal & Waktu Ekspor', $this->summary['exported_at'] ?? '-', '', 'Filter Tahun', $this->summary['filter_year_label'] ?? 'Semua Tahun', ''],
            ['Filter Wilayah', $this->summary['filter_location_label'] ?? 'Semua Wilayah', '', 'Total Data Dianalisis', $totalAll, ''],
            // Row 6: Spacer
            ['', '', '', '', '', ''],
            // Row 7: Table Header
            [
                'No',
                'Kategori Gender',
                'Jumlah Data',
                'Persentase (Data Valid)',
                'Persentase (Total Data)',
                'Keterangan Kategori',
            ],
            // Row 8: Laki-laki
            [
                1,
                'Laki-laki',
                $laki,
                $pctLakiValid,
                $pctLakiTotal,
                'Data terverifikasi kategori Laki-laki',
            ],
            // Row 9: Perempuan
            [
                2,
                'Perempuan',
                $perempuan,
                $pctPerempuanValid,
                $pctPerempuanTotal,
                'Data terverifikasi kategori Perempuan',
            ],
            // Row 10: Belum Diisi / Tidak Diketahui
            [
                3,
                'Belum Diisi / Tidak Diketahui',
                $unknown,
                '-',
                $pctUnknownTotal,
                'Data belum memiliki atribut gender / bernilai kosong (NULL)',
            ],
            // Row 11: Subtotal Valid
            [
                '',
                'Total Data Gender Valid (Terisi)',
                $totalValid,
                $totalValid > 0 ? 1.0 : 0.0,
                $pctValidTotal,
                'Akumulasi Laki-laki + Perempuan',
            ],
            // Row 12: Grand Total
            [
                '',
                'Total Keseluruhan',
                $totalAll,
                '-',
                $totalAll > 0 ? 1.0 : 0.0,
                'Total seluruh data sesuai filter aktif (tanpa duplikasi)',
            ],
            // Row 13: Spacer
            ['', '', '', '', '', ''],
            // Row 14: Catatan
            [
                'Catatan Metodologi:',
                $gender['source_note'] ?? 'Data gender diambil dari field database yang sah tanpa menebak dari nama pemilik usaha.',
                '',
                '',
                '',
                '',
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 34,
            'C' => 18,
            'D' => 24,
            'E' => 24,
            'F' => 42,
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
        $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        $sheet->mergeCells('A1:F1');
        $sheet->mergeCells('A2:F2');
        $sheet->mergeCells('B4:C4');
        $sheet->mergeCells('E4:F4');
        $sheet->mergeCells('B5:C5');
        $sheet->mergeCells('E5:F5');
        $sheet->mergeCells('B14:F14');

        $sheet->getRowDimension(1)->setRowHeight(30);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(4)->setRowHeight(20);
        $sheet->getRowDimension(5)->setRowHeight(20);
        $sheet->getRowDimension(7)->setRowHeight(26);
        for ($r = 8; $r <= 12; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(22);
        }
        $sheet->getRowDimension(14)->setRowHeight(24);

        // Banner
        $sheet->getStyle('A1:F1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 15, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '285E3B']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        $sheet->getStyle('A2:F2')->applyFromArray([
            'font' => ['bold' => false, 'size' => 10, 'color' => ['rgb' => 'E2F1E7']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        // Metadata box
        $sheet->getStyle('A4:F5')->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getStyle('A4:A5')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
        ]);
        $sheet->getStyle('D4:D5')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
        ]);
        $sheet->getStyle('E5')->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('E5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Table Header (Row 7)
        $sheet->getStyle('A7:F7')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '1E462D']],
            ],
        ]);

        // Table Body & Totals (Rows 8-12)
        $sheet->getStyle('A8:F12')->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);

        // Zebra stripe on Row 9
        $sheet->getStyle('A9:F9')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('F8FAF9');

        // Alignments & Formats
        $sheet->getStyle('A8:A12')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('C8:C12')->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('C8:C12')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        foreach (range(8, 12) as $r) {
            foreach (['D', 'E'] as $col) {
                $val = $sheet->getCell("{$col}{$r}")->getValue();
                if (is_numeric($val)) {
                    $sheet->getStyle("{$col}{$r}")->getNumberFormat()->setFormatCode('0.0%');
                    $sheet->getStyle("{$col}{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                } else {
                    $sheet->getStyle("{$col}{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }
            }
        }

        // Subtotal Valid Row (Row 11)
        $sheet->getStyle('A11:F11')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
        ]);

        // Grand Total Row (Row 12)
        $sheet->getStyle('A12:F12')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'borders' => [
                'top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '367D50']],
                'bottom' => ['borderStyle' => Border::BORDER_DOUBLE, 'color' => ['rgb' => '367D50']],
            ],
        ]);

        // Methodology Note Row (Row 14)
        $sheet->getStyle('A14:F14')->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '475569']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8FAFC']],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);
        $sheet->getStyle('A14')->getFont()->setBold(true)->setItalic(false);

        $sheet->freezePane('A8');

        return [];
    }
}

