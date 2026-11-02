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

class RingkasanSurveiSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    protected array $summary;

    public function __construct(array $summary)
    {
        $this->summary = $summary;
    }

    public function title(): string
    {
        return 'Ringkasan';
    }

    public function array(): array
    {
        $meta = $this->summary['meta'] ?? [];
        $totalSurveys = (int) ($meta['total_surveys'] ?? 0);
        $totalResponses = (int) ($meta['total_responses'] ?? 0);
        $overallAverage = (float) ($meta['overall_average'] ?? 0);
        $totalNrrTertimbang = (float) ($meta['total_nrr_tertimbang'] ?? 0);
        $ikmKonversi = (float) ($meta['ikm_konversi'] ?? 0);
        $mutu = (string) ($meta['mutu_pelayanan'] ?? '-');
        $kategori = (string) ($meta['kategori_mutu'] ?? 'Belum Ada Data');

        return [
            // Row 1: Title Banner
            ['REKAPITULASI SURVEI PELAYANAN (9 INDIKATOR KEPUASAN MASYARAKAT)', '', '', ''],
            // Row 2: Subtitle Banner
            ['DPMPTSP — Sistem Informasi Geografis Map Perizinan (PermenPAN-RB No. 14 Tahun 2017)', '', '', ''],
            // Row 3: Blank spacer
            ['', '', '', ''],
            // Row 4-7: Metadata block
            ['Nama Aplikasi', 'Dashboard Map Perizinan', 'Tahun / Periode', $this->summary['filter_year_label'] ?? 'Semua Tahun'],
            ['Instansi Penyelenggara', 'DPMPTSP', 'Filter Instansi Responden', $this->summary['filter_instansi_label'] ?? 'Semua Instansi'],
            ['Rentang Tanggal', $this->summary['filter_date_range_label'] ?? 'Semua Periode', 'Pencarian Kata Kunci', $this->summary['filter_search_label'] ?? '-'],
            ['Waktu Ekspor Laporan', $this->summary['exported_at'] ?? '-', 'Status Validasi Responden', 'Terverifikasi NIK Dukcapil'],
            // Row 8: Blank spacer
            ['', '', '', ''],

            // Row 9: Section 1 Header
            ['I. RINGKASAN METRIK SURVEI & INDEKS KEPUASAN MASYARAKAT (IKM)', '', '', ''],
            // Row 10: Table 1 Columns
            ['Indikator Metrik Rekapitulasi', 'Nilai / Capaian', 'Keterangan & Satuan', 'Mutu & Status Kinerja'],
            // Rows 11-17: Table 1 Data Rows
            ['Total Pengisian Survei (Sesi Responden)', $totalSurveys, 'Orang / Sesi Selesai', 'Data Responden Terverifikasi NIK'],
            ['Total Jawaban Masuk (Seluruh Butir)', $totalResponses, 'Jawaban Masuk', 'Akumulasi 9 Unsur Pelayanan'],
            ['Rata-rata Skor Keseluruhan', number_format($overallAverage, 2), 'Skala 1,00 - 4,00', 'Rata-rata Seluruh Respon Survei'],
            ['Total NRR Tertimbang (9 Unsur)', number_format($totalNrrTertimbang, 4), 'Skala 0,111 - 4,000', 'Akumulasi NRR × 0,111 Sesuai Regulasi'],
            ['Nilai IKM Konversi', number_format($ikmKonversi, 2), 'Skala 25,00 - 100,00', 'Total NRR Tertimbang × 25'],
            ['Mutu Kualitas Pelayanan', 'Mutu ' . $mutu, 'Kategori Mutu PermenPAN-RB', 'Klasifikasi Mutu ' . $mutu],
            ['Kategori Kualitas Pelayanan', $kategori, 'Penilaian Indeks Pelayanan Publik', 'Tingkat Kinerja: ' . $kategori],
            // Row 18: Blank spacer
            ['', '', '', ''],

            // Row 19: Section 2 Header
            ['II. PEDOMAN NILAI INDEKS KEPUASAN MASYARAKAT (PERMENPAN-RB NO. 14 TAHUN 2017)', '', '', ''],
            // Row 20: Table 2 Columns
            ['Nilai Persepsi (NRR)', 'Nilai Interval Konversi (IKM)', 'Mutu Pelayanan', 'Kinerja Pelayanan'],
            // Rows 21-24: Reference Data
            ['3,5324 - 4,0000', '88,31 - 100,00', 'A', 'Sangat Baik'],
            ['3,0644 - 3,5320', '76,61 - 88,30', 'B', 'Baik'],
            ['2,6000 - 3,0640', '65,00 - 76,60', 'C', 'Kurang Baik'],
            ['1,0000 - 2,5996', '25,00 - 64,99', 'D', 'Tidak Baik'],
            // Row 25: Blank spacer
            ['', '', '', ''],

            // Row 26: Footnote
            ['* Catatan: Nilai IKM dihitung berdasarkan PermenPAN-RB No. 14 Tahun 2017. NRR per Unsur = (Total Nilai Unsur / Jumlah Responden); NRR Tertimbang = NRR per Unsur × 0.111; Nilai IKM Konversi = Total NRR Tertimbang × 25.', '', '', ''],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 44,
            'B' => 26,
            'C' => 36,
            'D' => 32,
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
        $sheet->mergeCells('A9:D9');
        $sheet->mergeCells('A19:D19');
        $sheet->mergeCells('A26:D26');

        // Base font
        $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        // Row heights
        $sheet->getRowDimension(1)->setRowHeight(30);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(9)->setRowHeight(24);
        $sheet->getRowDimension(10)->setRowHeight(24);
        $sheet->getRowDimension(19)->setRowHeight(24);
        $sheet->getRowDimension(20)->setRowHeight(24);

        // Title banner styling
        $sheet->getStyle('A1:D1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
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

        // Metadata box (Rows 4-7)
        $sheet->getStyle('A4:D7')->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);
        $sheet->getStyle('A4:A7')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
        ]);
        $sheet->getStyle('C4:C7')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
        ]);
        for ($r = 4; $r <= 7; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(20);
        }

        // Section 1 Header (Row 9)
        $sheet->getStyle('A9:D9')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);

        // Table 1 Header (Row 10)
        $sheet->getStyle('A10:D10')->applyFromArray([
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

        // Table 1 Data Rows (Rows 11-17)
        $sheet->getStyle('A11:D17')->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        for ($r = 11; $r <= 17; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(20);
            $sheet->getStyle("B{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("C{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle("D{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        }
        // Bold key metrics
        $sheet->getStyle('A11:A17')->getFont()->setBold(true);
        $sheet->getStyle('B11:B17')->getFont()->setBold(true);
        $sheet->getStyle('B15')->getFont()->setSize(11)->getColor()->setRGB('285E3B');
        $sheet->getStyle('B16')->getFont()->setSize(11)->getColor()->setRGB('285E3B');

        // Section 2 Header (Row 19)
        $sheet->getStyle('A19:D19')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);

        // Table 2 Header (Row 20)
        $sheet->getStyle('A20:D20')->applyFromArray([
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

        // Table 2 Data Rows (Rows 21-24)
        $sheet->getStyle('A21:D24')->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        for ($r = 21; $r <= 24; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(20);
        }

        // Footnote (Row 26)
        $sheet->getStyle('A26:D26')->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '64748B']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);
        $sheet->getRowDimension(26)->setRowHeight(24);

        return [];
    }
}

