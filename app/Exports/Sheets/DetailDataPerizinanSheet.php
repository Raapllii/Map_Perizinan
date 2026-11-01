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

class DetailDataPerizinanSheet extends DefaultValueBinder implements
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
    protected array $genderMap;
    protected array $summary;
    protected int $rowNumber = 0;

    public function __construct(Builder $query, array $genderMap = [], array $summary = [])
    {
        $this->query = $query;
        $this->genderMap = $genderMap;
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
        return $this->query;
    }

    public function headings(): array
    {
        return [
            'No',
            'NIB',
            'Nama Perusahaan',
            'Nama Pemilik / Pengguna',
            'Gender',
            'Nama Proyek',
            'KBLI',
            'Kategori Usaha',
            'Skala Usaha',
            'Risiko Proyek',
            'Status',
            'Kecamatan',
            'Kelurahan',
            'Tanggal Pengajuan',
            'Tanggal Terbit OSS',
        ];
    }

    public function map($business): array
    {
        $this->rowNumber++;

        $gender = $this->genderMap[$business->id] ?? GenderNormalizer::fromBusiness($business);
        if ($gender === GenderNormalizer::UNKNOWN) {
            $genderLabel = 'Belum Diisi / Tidak Diketahui';
        } else {
            $genderLabel = $gender;
        }

        $tglPengajuan = $this->formatDateDisplay($business->day_of_tanggal_pengajuan_proyek ?? null);
        $tglTerbit = $this->formatDateDisplay($business->tanggal_terbit_oss ?? null);

        if ($tglPengajuan === '-' && $tglTerbit !== '-') {
            $tglPengajuan = $tglTerbit;
        }

        return [
            $this->rowNumber,
            $business->nib ?: '-',
            $business->nama_perusahaan ?: '-',
            $business->nama_user ?: '-',
            $genderLabel,
            $business->nama_proyek ?: '-',
            $business->kbli ?: '-',
            $business->judul_kbli ?: '-',
            $business->uraian_skala_usaha ?: '-',
            $business->uraian_risiko_proyek ?: 'Tidak Diisi',
            $business->status ?: 'Aktif',
            $business->kecamatan_usaha ?: '-',
            $business->kelurahan_usaha ?: '-',
            $tglPengajuan,
            $tglTerbit,
        ];
    }

    private function formatDateDisplay($value): string
    {
        if (empty($value)) {
            return '-';
        }
        try {
            if ($value instanceof \DateTimeInterface) {
                return $value->format('Y-m-d');
            }
            $str = trim((string) $value);
            if ($str === '' || $str === '-') {
                return '-';
            }
            return Carbon::parse($str)->format('Y-m-d');
        } catch (\Throwable $e) {
            return (string) $value;
        }
    }

    public function bindValue(Cell $cell, $value)
    {
        // Keep NIB (B) and KBLI (G) strictly as strings to prevent scientific notation
        if (in_array($cell->getColumn(), ['B', 'G'], true) && $value !== null && $cell->getRow() > 4) {
            $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);
            return true;
        }

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
            'B' => 19,
            'C' => 34,
            'D' => 26,
            'E' => 26,
            'F' => 32,
            'G' => 12,
            'H' => 34,
            'I' => 18,
            'J' => 18,
            'K' => 14,
            'L' => 22,
            'M' => 22,
            'N' => 18,
            'O' => 18,
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

        // Populate Banner on Rows 1-2
        $exportedAt = $this->summary['exported_at'] ?? date('d M Y, H:i');
        $filterYear = $this->summary['filter_year_label'] ?? 'Semua Tahun';
        $totalRecords = number_format((int) ($this->summary['gender']['total'] ?? 0), 0, ',', '.');

        $sheet->setCellValue('A1', 'DETAIL DATA PERIZINAN USAHA — DASHBOARD MAP PERIZINAN');
        $sheet->setCellValue('A2', "Filter: {$filterYear}  |  Total Data: {$totalRecords} Usaha  |  Diekspor: {$exportedAt}");

        $sheet->mergeCells('A1:O1');
        $sheet->mergeCells('A2:O2');

        $sheet->getRowDimension(1)->setRowHeight(28);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(3)->setRowHeight(8);
        $sheet->getRowDimension(4)->setRowHeight(26);

        $sheet->getStyle('A1:O1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '285E3B']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        $sheet->getStyle('A2:O2')->applyFromArray([
            'font' => ['bold' => false, 'size' => 10, 'color' => ['rgb' => 'E2F1E7']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '367D50']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'indent' => 1,
            ],
        ]);

        // Table Header at Row 4
        $sheet->getStyle('A4:O4')->applyFromArray([
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

        // Enable AutoFilter & Freeze Header Row
        $sheet->setAutoFilter('A4:O4');
        $sheet->freezePane('A5');

        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= 5) {
            $sheet->getStyle("A5:O{$highestRow}")->applyFromArray([
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

            // Center specific columns: No (A), NIB (B), Gender (E), KBLI (G), Risiko (J), Status (K), Dates (N, O)
            $sheet->getStyle("A5:B{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E5:E{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G5:G{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("J5:K{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("N5:O{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Alternating row colors for readability (cap loop to 2000 rows for speed on huge datasets)
            $maxStripeRow = min($highestRow, 2005);
            for ($r = 5; $r <= $maxStripeRow; $r++) {
                if ($r % 2 === 0) {
                    $sheet->getStyle("A{$r}:O{$r}")->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('F8FAF9');
                }
            }
        }

        return [];
    }
}

