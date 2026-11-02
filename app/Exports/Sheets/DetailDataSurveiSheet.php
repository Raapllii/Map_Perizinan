<?php

namespace App\Exports\Sheets;

use App\Http\Controllers\Api\PublicMapServiceSurveyController;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DetailDataSurveiSheet extends DefaultValueBinder implements
    FromQuery,
    WithTitle,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithColumnWidths,
    WithCustomStartCell,
    WithCustomValueBinder
{
    protected Builder $query;
    protected array $summary;
    protected int $rowNumber = 0;

    protected static array $codeMap = [
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

    public function __construct(Builder $query, array $summary = [])
    {
        $this->query = $query;
        $this->summary = $summary;
    }

    public function title(): string
    {
        return 'Data Survei';
    }

    public function startCell(): string
    {
        return 'A4';
    }

    public function query()
    {
        return (clone $this->query)
            ->with(['accessLog', 'business', 'survey'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    public function headings(): array
    {
        return [
            'No',
            'ID Jawaban',
            'ID Sesi Survei',
            'Tanggal & Waktu Survei',
            'Nama Responden',
            'Instansi / Asal Responden',
            'NIK (Masked)',
            'Nama Usaha Terkait',
            'Kode Unsur',
            'Unsur Pelayanan',
            'Pertanyaan',
            'Jawaban Responden',
            'Skor Nilai',
        ];
    }

    public function map($res): array
    {
        $this->rowNumber++;

        $unsurCode = self::$codeMap[$res->indicator_key] ?? '-';

        $createdAt = '-';
        if (!empty($res->created_at)) {
            try {
                $createdAt = Carbon::parse($res->created_at)->format('Y-m-d H:i');
            } catch (\Throwable $e) {
                $createdAt = (string) $res->created_at;
            }
        }

        $maskedNik = PublicMapServiceSurveyController::maskNik($res->accessLog->nik ?? null);

        return [
            $this->rowNumber,
            (int) $res->id,
            (int) ($res->survey_id ?? 0),
            $createdAt,
            $res->accessLog->nama ?? 'Pengunjung',
            $res->accessLog->instansi ?? '-',
            $maskedNik,
            $res->business->nama_perusahaan ?? '-',
            $unsurCode,
            $res->indicator_name ?? '-',
            $res->question ?? '-',
            $res->answer_label ?? '-',
            (int) $res->score,
        ];
    }

    public function bindValue(Cell $cell, $value)
    {
        if (is_numeric($value)) {
            $cell->setValueExplicit($value, DataType::TYPE_NUMERIC);
            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,   // No
            'B' => 12,  // ID Jawaban
            'C' => 14,  // ID Sesi Survei
            'D' => 20,  // Tanggal & Waktu Survei
            'E' => 25,  // Nama Responden
            'F' => 25,  // Instansi
            'G' => 18,  // NIK Masked
            'H' => 30,  // Usaha Terkait
            'I' => 12,  // Kode Unsur
            'J' => 30,  // Unsur Pelayanan
            'K' => 45,  // Pertanyaan
            'L' => 25,  // Jawaban Responden
            'M' => 12,  // Skor Nilai
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

        // Prepend custom banner in rows 1 and 2
        $sheet->mergeCells('A1:M1');
        $sheet->mergeCells('A2:M2');

        $sheet->setCellValue('A1', 'DATA RINCIAN JAWABAN SURVEI PELAYANAN (9 INDIKATOR)');
        $sheet->setCellValue('A2', 'Daftar Jawaban Responden Terverifikasi NIK — Kerahasiaan Data Terlindungi (Masked NIK)');

        // Base font
        $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        // Banner styling
        $sheet->getRowDimension(1)->setRowHeight(30);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getStyle('A1:M1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '285E3B']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);
        $sheet->getStyle('A2:M2')->applyFromArray([
            'font' => ['bold' => false, 'size' => 10, 'color' => ['rgb' => 'E2F1E7']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
        ]);

        // Table Header Styling (Row 4)
        $sheet->getRowDimension(4)->setRowHeight(26);
        $sheet->getStyle('A4:M4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '285E3B']],
            ],
        ]);

        // Freeze panes so header row 4 stays visible
        $sheet->freezePane('A5');

        // Apply formatting across data rows
        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= 5) {
            $sheet->getStyle("A5:M{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
                ],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);

            for ($r = 5; $r <= $highestRow; $r++) {
                $sheet->getRowDimension($r)->setRowHeight(20);
                $sheet->getStyle("A{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("B{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("C{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("G{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("I{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("M{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
        }

        return [];
    }
}

