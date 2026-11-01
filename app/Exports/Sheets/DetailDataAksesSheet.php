<?php

namespace App\Exports\Sheets;

use App\Support\GenderNormalizer;
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

class DetailDataAksesSheet extends DefaultValueBinder implements
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

    public function __construct(Builder $query, array $summary = [])
    {
        $this->query = $query;
        $this->summary = $summary;
    }

    public function title(): string
    {
        return 'Detail Data';
    }

    public function startCell(): string
    {
        return 'A4';
    }

    public function query()
    {
        return (clone $this->query)->orderByDesc('accessed_at')->orderByDesc('id');
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama Pengunjung',
            'Gender',
            'Instansi / Asal',
            'Waktu Akses',
            'Rating Feedback',
            'Komentar Feedback',
        ];
    }

    public function map($log): array
    {
        $this->rowNumber++;

        $gender = GenderNormalizer::fromAccessLog($log);
        $genderLabel = $gender === GenderNormalizer::UNKNOWN ? 'Belum Diisi / Tidak Diketahui' : $gender;

        $accessedAt = '-';
        if (!empty($log->accessed_at)) {
            try {
                $accessedAt = Carbon::parse($log->accessed_at)->format('Y-m-d H:i');
            } catch (\Throwable $e) {
                $accessedAt = (string) $log->accessed_at;
            }
        }

        $feedbackRating = '-';
        $feedbackComment = '-';
        if (isset($log->feedback) && $log->feedback) {
            $feedbackRating = $log->feedback->rating ?: '-';
            $feedbackComment = $log->feedback->comment ?: '-';
        }

        return [
            $this->rowNumber,
            $log->nama ?: '-',
            $genderLabel,
            $log->instansi ?: '-',
            $accessedAt,
            $feedbackRating,
            $feedbackComment,
        ];
    }

    public function bindValue(Cell $cell, $value)
    {
        if ($cell->getColumn() === 'A' && is_numeric($value) && $cell->getRow() > 4) {
            $cell->setValueExplicit((int) $value, DataType::TYPE_NUMERIC);
            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 7,
            'B' => 30,
            'C' => 28,
            'D' => 32,
            'E' => 20,
            'F' => 18,
            'G' => 38,
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

        $exportedAt = $this->summary['exported_at'] ?? date('d M Y, H:i');
        $filterYear = $this->summary['filter_year_label'] ?? 'Semua Periode';
        $totalRecords = number_format((int) ($this->summary['gender']['total'] ?? 0), 0, ',', '.');

        $sheet->setCellValue('A1', 'DETAIL LOG AKSES PENGUNJUNG PETA PUBLIK — DASHBOARD MAP PERIZINAN');
        $sheet->setCellValue('A2', "Filter: {$filterYear}  |  Total Pengunjung Unik: {$totalRecords}  |  Diekspor: {$exportedAt}");

        $sheet->mergeCells('A1:G1');
        $sheet->mergeCells('A2:G2');

        $sheet->getRowDimension(1)->setRowHeight(28);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(3)->setRowHeight(8);
        $sheet->getRowDimension(4)->setRowHeight(26);

        $sheet->getStyle('A1:G1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '285E3B']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        $sheet->getStyle('A2:G2')->applyFromArray([
            'font' => ['bold' => false, 'size' => 10, 'color' => ['rgb' => 'E2F1E7']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        $sheet->getStyle('A4:G4')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 10,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '367D50'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '1E462D'],
                ],
            ],
        ]);

        $sheet->setAutoFilter('A4:G4');
        $sheet->freezePane('A5');

        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= 5) {
            $sheet->getStyle("A5:G{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CBD5E1'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_TOP,
                    'wrapText' => true,
                ],
            ]);

            $sheet->getStyle("A5:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("C5:C{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E5:F{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $maxStripeRow = min($highestRow, 2005);
            for ($r = 5; $r <= $maxStripeRow; $r++) {
                if ($r % 2 === 0) {
                    $sheet->getStyle("A{$r}:G{$r}")->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('F8FAF9');
                }
            }
        }

        return [];
    }
}

