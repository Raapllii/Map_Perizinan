<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GenderNormalizer
{
    public const MALE = 'Laki-laki';
    public const FEMALE = 'Perempuan';
    public const UNKNOWN = 'Tidak Diketahui';

    public const INDICATOR_TITLES = [
        'jenis kelamin',
        'gender',
        'jenis_kelamin',
        'kelamin',
    ];

    /**
     * Normalize a raw gender string into canonical category without guessing from names/titles.
     */
    public static function normalize(?string $raw): string
    {
        if ($raw === null) {
            return self::UNKNOWN;
        }

        $clean = strtolower(preg_replace('/\s+/', ' ', trim($raw)));
        if ($clean === '' || $clean === '-' || $clean === 'null' || $clean === 'n/a') {
            return self::UNKNOWN;
        }

        if (in_array($clean, ['laki-laki', 'laki - laki', 'laki', 'l', 'lk', 'pria', 'male', 'm'], true)) {
            return self::MALE;
        }

        if (in_array($clean, ['perempuan', 'p', 'pr', 'wanita', 'female', 'f', 'w'], true)) {
            return self::FEMALE;
        }

        return self::UNKNOWN;
    }

    /**
     * Extract canonical gender for a Business model instance from available columns or indicators.
     * Never guesses from nama_user or nama_perusahaan.
     */
    public static function fromBusiness($business): string
    {
        if (!$business) {
            return self::UNKNOWN;
        }

        // 1. Direct column if present on model/stdClass
        foreach (['jenis_kelamin', 'gender', 'gender_value'] as $attr) {
            $val = is_array($business) ? ($business[$attr] ?? null) : ($business->{$attr} ?? null);
            if ($val !== null && trim((string) $val) !== '') {
                return self::normalize((string) $val);
            }
        }

        // 2. Relational business_indicators if loaded
        $indicators = null;
        if (is_object($business)) {
            if (method_exists($business, 'relationLoaded') && $business->relationLoaded('indicators')) {
                $indicators = $business->indicators;
            } elseif (isset($business->indicators) && is_iterable($business->indicators)) {
                $indicators = $business->indicators;
            }
        } elseif (is_array($business) && isset($business['indicators']) && is_iterable($business['indicators'])) {
            $indicators = $business['indicators'];
        }

        if ($indicators) {
            foreach ($indicators as $ind) {
                $judul = is_array($ind) ? ($ind['judul'] ?? '') : ($ind->judul ?? '');
                $nilai = is_array($ind) ? ($ind['nilai'] ?? null) : ($ind->nilai ?? null);
                $judulNorm = strtolower(trim((string) $judul));
                if (in_array($judulNorm, self::INDICATOR_TITLES, true) && $nilai !== null && trim((string) $nilai) !== '') {
                    return self::normalize((string) $nilai);
                }
            }
        }

        return self::UNKNOWN;
    }

    /**
     * Extract gender from verified 16-digit Indonesian NIK (Dukcapil standard: digits 7-8 are DD, +40 for female)
     * or explicit jenis_kelamin field if available. Never guesses from visitor name.
     */
    public static function fromNikOrField(?string $nik, ?string $rawGender = null): string
    {
        if ($rawGender !== null && trim($rawGender) !== '') {
            $norm = self::normalize($rawGender);
            if ($norm !== self::UNKNOWN) {
                return $norm;
            }
        }

        if ($nik === null) {
            return self::UNKNOWN;
        }

        $cleanNik = trim($nik);
        if (!preg_match('/^\d{16}$/', $cleanNik)) {
            return self::UNKNOWN;
        }

        $dayPart = (int) substr($cleanNik, 6, 2);
        $monthPart = (int) substr($cleanNik, 8, 2);

        if ($monthPart < 1 || $monthPart > 12) {
            return self::UNKNOWN;
        }

        if ($dayPart >= 1 && $dayPart <= 31) {
            return self::MALE;
        }

        if ($dayPart >= 41 && $dayPart <= 71) {
            return self::FEMALE;
        }

        return self::UNKNOWN;
    }

    /**
     * Calculate gender recapitulation for a Business query builder without double-counting any business.
     */
    public static function aggregateForBusinessQuery(Builder $baseQuery): array
    {
        $cloned = (clone $baseQuery)->setEagerLoads([])->reorder();

        $totalAll = (clone $cloned)->count('businesses.id');
        if ($totalAll === 0) {
            return self::buildRecapPayload(0, 0, 0, [
                'source_available' => self::hasDirectGenderColumn(),
                'source_note' => 'Data gender diambil dari field jenis_kelamin / indikator usaha yang tersedia.',
            ]);
        }

        $hasDirectColumn = self::hasDirectGenderColumn();
        $directColName = self::getDirectGenderColumnName();
        $hasIndicatorsTable = Schema::hasTable('business_indicators');

        $lakiLaki = 0;
        $perempuan = 0;

        if ($hasDirectColumn && $directColName) {
            $rows = (clone $cloned)
                ->select("businesses.id", "businesses.{$directColName} as raw_gender")
                ->get();

            foreach ($rows as $row) {
                $g = self::normalize($row->raw_gender ?? null);
                if ($g === self::MALE) {
                    $lakiLaki++;
                } elseif ($g === self::FEMALE) {
                    $perempuan++;
                }
            }
        } elseif ($hasIndicatorsTable) {
            // Deduplicate by business_id so one business with multiple indicators is NEVER counted twice
            $indicatorRows = DB::table('business_indicators')
                ->joinSub(
                    (clone $cloned)->select('businesses.id'),
                    'filtered_businesses',
                    'business_indicators.business_id',
                    '=',
                    'filtered_businesses.id'
                )
                ->whereIn(DB::raw('LOWER(TRIM(business_indicators.judul))'), self::INDICATOR_TITLES)
                ->whereNotNull('business_indicators.nilai')
                ->orderBy('business_indicators.business_id')
                ->orderBy('business_indicators.sort_order', 'asc')
                ->orderBy('business_indicators.id', 'asc')
                ->get(['business_indicators.business_id', 'business_indicators.nilai']);

            $seenBusinessIds = [];
            foreach ($indicatorRows as $indRow) {
                $bId = $indRow->business_id;
                if (isset($seenBusinessIds[$bId])) {
                    continue;
                }
                $seenBusinessIds[$bId] = true;

                $g = self::normalize($indRow->nilai ?? null);
                if ($g === self::MALE) {
                    $lakiLaki++;
                } elseif ($g === self::FEMALE) {
                    $perempuan++;
                }
            }
        }

        $tidakDiketahui = max(0, $totalAll - ($lakiLaki + $perempuan));

        return self::buildRecapPayload($lakiLaki, $perempuan, $tidakDiketahui, [
            'source_available' => $hasDirectColumn || ($lakiLaki + $perempuan > 0),
            'source_note' => ($lakiLaki + $perempuan === 0)
                ? 'Data ekspor OSS standar belum memuat kolom jenis kelamin pemilik usaha, sehingga data yang belum memiliki atribut gender dikategorikan sebagai Belum Diisi / Tidak Diketahui.'
                : 'Data gender bersumber dari atribut jenis kelamin / indikator usaha yang tercatat di sistem.',
        ]);
    }

    /**
     * Build standardized gender recapitulation payload.
     */
    public static function buildRecapPayload(int $lakiLaki, int $perempuan, int $tidakDiketahui, array $extra = []): array
    {
        $lakiLaki = max(0, $lakiLaki);
        $perempuan = max(0, $perempuan);
        $tidakDiketahui = max(0, $tidakDiketahui);

        $totalValid = $lakiLaki + $perempuan;
        $totalAll = $totalValid + $tidakDiketahui;

        $pctLakiValid = $totalValid > 0 ? round(($lakiLaki / $totalValid) * 100, 1) : 0.0;
        $pctPerempuanValid = $totalValid > 0 ? round(($perempuan / $totalValid) * 100, 1) : 0.0;

        $pctLakiTotal = $totalAll > 0 ? round(($lakiLaki / $totalAll) * 100, 1) : 0.0;
        $pctPerempuanTotal = $totalAll > 0 ? round(($perempuan / $totalAll) * 100, 1) : 0.0;
        $pctUnknownTotal = $totalAll > 0 ? round(($tidakDiketahui / $totalAll) * 100, 1) : 0.0;

        return array_merge([
            'laki_laki' => $lakiLaki,
            'perempuan' => $perempuan,
            'tidak_diketahui' => $tidakDiketahui,
            'total_valid' => $totalValid,
            'total' => $totalAll,
            'persentase_laki_valid' => $pctLakiValid,
            'persentase_perempuan_valid' => $pctPerempuanValid,
            'persentase_laki_total' => $pctLakiTotal,
            'persentase_perempuan_total' => $pctPerempuanTotal,
            'persentase_tidak_diketahui_total' => $pctUnknownTotal,
            'items' => [
                [
                    'key' => 'laki_laki',
                    'name' => 'Laki-laki',
                    'value' => $lakiLaki,
                    'percentage_valid' => $pctLakiValid,
                    'percentage_total' => $pctLakiTotal,
                    'color' => '#2563eb', // Blue
                ],
                [
                    'key' => 'perempuan',
                    'name' => 'Perempuan',
                    'value' => $perempuan,
                    'percentage_valid' => $pctPerempuanValid,
                    'percentage_total' => $pctPerempuanTotal,
                    'color' => '#db2777', // Pink/Rose
                ],
                [
                    'key' => 'tidak_diketahui',
                    'name' => 'Belum Diisi / Tidak Diketahui',
                    'value' => $tidakDiketahui,
                    'percentage_valid' => null,
                    'percentage_total' => $pctUnknownTotal,
                    'color' => '#94a3b8', // Slate/Gray
                ],
            ],
        ], $extra);
    }

    public static function hasDirectGenderColumn(): bool
    {
        return self::getDirectGenderColumnName() !== null;
    }

    public static function getDirectGenderColumnName(): ?string
    {
        try {
            if (!Schema::hasTable('businesses')) {
                return null;
            }
            if (Schema::hasColumn('businesses', 'jenis_kelamin')) {
                return 'jenis_kelamin';
            }
            if (Schema::hasColumn('businesses', 'gender')) {
                return 'gender';
            }
        } catch (\Throwable $e) {
            return null;
        }

        return null;
    }
}
