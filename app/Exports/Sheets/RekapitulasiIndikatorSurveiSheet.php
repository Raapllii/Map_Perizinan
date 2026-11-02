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

class RekapitulasiIndikatorSurveiSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    protected array $summary;
    protected int $distroStartRow = 0;
    protected int $distroEndRow = 0;

    public function __construct(array $summary)
    {
        $this->summary = $summary;
    }

    public function title(): string
    {
        return 'Rekapitulasi Indikator';
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

        $elements = $this->summary['ikm_per_unsur']['elements'] ?? [];
        $indicators = $this->summary['indicators'] ?? [];

        // Map indicator key to question
        $questions = [];
        foreach ($indicators as $ind) {
            $questions[$ind['key']] = $ind['question'] ?? '-';
        }

        $rows = [
            // Row 1: Banner Title
            ['REKAPITULASI NILAI INDEKS KEPUASAN MASYARAKAT (IKM) PER UNSUR PELAYANAN', '', '', '', '', '', '', '', '', '', ''],
            // Row 2: Banner Subtitle
            ['9 Unsur Pelayanan Berdasarkan PermenPAN-RB No. 14 Tahun 2017 — DPMPTSP Map Perizinan', '', '', '', '', '', '', '', '', '', ''],
            // Row 3: Blank
            ['', '', '', '', '', '', '', '', '', '', ''],
            // Row 4-5: Metadata strip
            [
                'Tahun / Periode', $this->summary['filter_year_label'] ?? 'Semua Tahun',
                '', 'Filter Instansi', $this->summary['filter_instansi_label'] ?? 'Semua Instansi',
                '', 'Total Responden', $totalSurveys . ' Orang',
                '', 'Nilai IKM Konversi', number_format($ikmKonversi, 2) . ' (Mutu ' . $mutu . ')'
            ],
            [
                'Rentang Tanggal', $this->summary['filter_date_range_label'] ?? 'Semua Periode',
                '', 'Pencarian', $this->summary['filter_search_label'] ?? '-',
                '', 'Total Jawaban', $totalResponses . ' Butir',
                '', 'Kategori Mutu', $kategori
            ],
            // Row 6: Blank
            ['', '', '', '', '', '', '', '', '', '', ''],
            // Row 7: Section 1 Header
            ['I. TABEL NILAI IKM PER UNSUR PELAYANAN (PERMENPAN-RB NO. 14 TAHUN 2017)', '', '', '', '', '', '', '', '', '', ''],
            // Row 8: Table 1 Headers
            ['No', 'Kode', 'Unsur Pelayanan', 'Butir Pertanyaan', 'Bobot', 'Total Nilai', 'Responden', 'NRR Unsur', 'NRR Tertimbang', 'Mutu', 'Kategori'],
        ];

        $sumTotalNilai = 0;
        foreach ($elements as $el) {
            $key = $el['key'] ?? '';
            $qText = $questions[$key] ?? '-';
            $totalNilai = (int) ($el['total_nilai'] ?? 0);
            $sumTotalNilai += $totalNilai;

            $rows[] = [
                $el['no'] ?? '-',
                $el['unsur_code'] ?? '-',
                $el['name'] ?? '-',
                $qText,
                '0,111',
                $totalNilai,
                (int) ($el['jumlah_responden'] ?? 0),
                number_format((float) ($el['nrr'] ?? 0), 2),
                number_format((float) ($el['nrr_tertimbang'] ?? 0), 4),
                $el['mutu'] ?? '-',
                $el['kategori'] ?? '-',
            ];
        }

        // Row 18: Summary Row 1 (Total NRR Tertimbang)
        $rows[] = [
            'TOTAL NRR TERTIMBANG (9 UNSUR PELAYANAN)', '', '', '',
            '1,000',
            $sumTotalNilai,
            $totalSurveys,
            number_format($overallAverage, 2),
            number_format($totalNrrTertimbang, 4),
            $mutu,
            $kategori,
        ];

        // Row 19: Summary Row 2 (Nilai IKM Konversi)
        $rows[] = [
            'NILAI IKM KONVERSI (Total NRR Tertimbang × 25)', '', '', '', '', '', '', '',
            number_format($ikmKonversi, 2),
            'Mutu ' . $mutu,
            $kategori,
        ];

        // Row 20: Blank
        $rows[] = ['', '', '', '', '', '', '', '', '', '', ''];

        // Row 21: Section 2 Header
        $rows[] = ['II. DISTRIBUSI PILIHAN JAWABAN RESPONDEN PER BUTIR UNSUR', '', '', '', '', '', '', '', '', '', ''];

        // Row 22: Table 2 Headers
        $rows[] = ['Kode', 'Unsur Pelayanan', 'Pilihan Jawaban', 'Nilai Skor', 'Jumlah Responden', 'Persentase (%)', 'Keterangan Pilihan', '', '', '', ''];

        $this->distroStartRow = count($rows) + 1;

        $codeMap = [
            'persyaratan' => 'U1',
            'prosedur' => 'U2',
            'waktu' => 'U3',
            'biaya' => 'U4',
            'produk' => 'U5',
            'kompetensi' => 'U6',
            'perilaku' => 'U7',
            'pengaduan' => 'U8',
            'sarana' => 'U9',
        ];

        foreach ($indicators as $ind) {
            $uCode = $codeMap[$ind['key'] ?? ''] ?? '-';
            $uName = $ind['name'] ?? '-';
            $distro = $ind['distribution'] ?? [];

            foreach ($distro as $opt) {
                $score = (int) ($opt['score'] ?? 0);
                $eval = match ($score) {
                    4 => 'Sangat Baik (Maksimal)',
                    3 => 'Baik (Memenuhi Standar)',
                    2 => 'Kurang Baik (Perlu Peningkatan)',
                    1 => 'Tidak Baik (Evaluasi Khusus)',
                    default => '-'
                };

                $rows[] = [
                    $uCode,
                    $uName,
                    $opt['label'] ?? '-',
                    $score,
                    (int) ($opt['count'] ?? 0),
                    number_format((float) ($opt['percentage'] ?? 0), 1) . '%',
                    $eval,
                    '', '', '', ''
                ];
            }
        }

        $this->distroEndRow = count($rows);

        return $rows;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,
            'B' => 10,
            'C' => 30,
            'D' => 45,
            'E' => 12,
            'F' => 14,
            'G' => 15,
            'H' => 14,
            'I' => 16,
            'J' => 12,
            'K' => 18,
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

        // Merge banners
        $sheet->mergeCells('A1:K1');
        $sheet->mergeCells('A2:K2');
        $sheet->mergeCells('A7:K7');
        $sheet->mergeCells('A18:D18');
        $sheet->mergeCells('A19:H19');
        $sheet->mergeCells('A21:K21');

        // Base font
        $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        // Banner styling
        $sheet->getRowDimension(1)->setRowHeight(30);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getStyle('A1:K1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '285E3B']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);
        $sheet->getStyle('A2:K2')->applyFromArray([
            'font' => ['bold' => false, 'size' => 10, 'color' => ['rgb' => 'E2F1E7']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);

        // Metadata rows (4-5)
        for ($r = 4; $r <= 5; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(20);
            $sheet->getStyle("A{$r}:K{$r}")->applyFromArray([
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);
            // Style label columns
            foreach (['A', 'D', 'G', 'J'] as $col) {
                $sheet->getStyle("{$col}{$r}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F3']],
                ]);
            }
        }

        // Section 1 Header (Row 7)
        $sheet->getRowDimension(7)->setRowHeight(24);
        $sheet->getStyle('A7:K7')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);

        // Table 1 Header (Row 8)
        $sheet->getRowDimension(8)->setRowHeight(24);
        $sheet->getStyle('A8:K8')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '285E3B']]],
        ]);

        // Table 1 Data Rows (Rows 9-17)
        $sheet->getStyle('A9:K17')->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        for ($r = 9; $r <= 17; $r++) {
            $sheet->getRowDimension($r)->setRowHeight(22);
            $sheet->getStyle("A{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("G{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("H{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("I{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("J{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("K{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // Summary Row 1 (Row 18)
        $sheet->getRowDimension(18)->setRowHeight(24);
        $sheet->getStyle('A18:K18')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '367D50']]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getStyle('A18')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('E18:K18')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('F18:G18')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        // Summary Row 2 (Row 19)
        $sheet->getRowDimension(19)->setRowHeight(26);
        $sheet->getStyle('A19:K19')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '285E3B']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '1E3A29']]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getStyle('A19')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('I19:K19')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Section 2 Header (Row 21)
        $sheet->getRowDimension(21)->setRowHeight(24);
        $sheet->getStyle('A21:K21')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '1E3A29']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F2EB']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);

        // Table 2 Header (Row 22)
        $sheet->getRowDimension(22)->setRowHeight(24);
        $sheet->getStyle('A22:G22')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '285E3B']]],
        ]);

        // Table 2 Data Rows (distroStartRow to distroEndRow)
        if ($this->distroStartRow > 0 && $this->distroEndRow >= $this->distroStartRow) {
            $sheet->getStyle("A{$this->distroStartRow}:G{$this->distroEndRow}")->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);
            for ($r = $this->distroStartRow; $r <= $this->distroEndRow; $r++) {
                $sheet->getRowDimension($r)->setRowHeight(20);
                $sheet->getStyle("A{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("E{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("F{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            }
        }

        return [];
    }
}

