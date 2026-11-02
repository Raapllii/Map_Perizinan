<?php

namespace App\Exports;

use App\Exports\Sheets\DetailDataSurveiSheet;
use App\Exports\Sheets\RekapitulasiIndikatorSurveiSheet;
use App\Exports\Sheets\RingkasanSurveiSheet;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class RekapitulasiSurveiExport implements WithMultipleSheets
{
    protected array $summary;
    protected Builder $responseQuery;

    public function __construct(array $summary, Builder $responseQuery)
    {
        $this->summary = $summary;
        $this->responseQuery = $responseQuery;
    }

    public function sheets(): array
    {
        return [
            new RingkasanSurveiSheet($this->summary),
            new RekapitulasiIndikatorSurveiSheet($this->summary),
            new DetailDataSurveiSheet(clone $this->responseQuery, $this->summary),
        ];
    }
}

