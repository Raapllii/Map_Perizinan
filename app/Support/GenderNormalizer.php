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
     * Normalize a raw gender string into canonical category without guessing from names, titles, or NIK digits.
     *
     * Supported variations:
     * - Laki-laki, laki-laki, L, LK, Pria, Male, M -> Laki-laki
     * - Perempuan, P, PR, Wanita, Female, F -> Perempuan
     * - Empty, null, or unrecognized -> Tidak Diketahui
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

        if (in_array($clean, ['laki-laki', 'laki - laki', 'laki_laki', 'laki', 'l', 'lk', 'pria', 'male', 'm'], true)) {
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

        // 1. Direct column if present on model/stdClass/array
        foreach (['jenis_kelamin', 'gender', 'gender_value'] as $attr) {
            $val = is_array($business) ? ($business[$attr] ?? null) : ($business->{$attr} ?? null);
            if ($val !== null && trim((string) $val) !== '') {
                $normalized = self::normalize((string) $val);
                if ($normalized !== self::UNKNOWN) {
                    return $normalized;
                }
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
                    $normalized = self::normalize((string) $nilai);
                    if ($normalized !== self::UNKNOWN) {
                        return $normalized;
                    }
                }
            }
        }

        return self::UNKNOWN;
    }

    /**
     * Extract canonical gender from explicit jenis_kelamin field received from Dukcapil verification.
     * Never guesses or infers gender from NIK digits or visitor name; empty or unrecognized values
     * always return Tidak Diketahui.
     */
    public static function fromNikOrField(?string $nik, ?string $rawGender = null): string
    {
        if ($rawGender !== null) {
            return self::normalize($rawGender);
        }

        // Support single-argument calls where a gender value is passed directly instead of a 16-digit NIK
        if ($nik !== null && !preg_match('/^\d{16}$/', trim($nik))) {
            return self::normalize($nik);
        }

        return self::UNKNOWN;
    }

    /**
     * Extract canonical gender for a PublicMapAccessLog model/stdClass/array.
     */
    public static function fromAccessLog($log): string
    {
        if (!$log) {
            return self::UNKNOWN;
        }

        foreach (['jenis_kelamin', 'verified_gender', 'gender'] as $attr) {
            $val = is_array($log) ? ($log[$attr] ?? null) : ($log->{$attr} ?? null);
            if ($val !== null && trim((string) $val) !== '') {
                return self::normalize((string) $val);
            }
        }

        return self::UNKNOWN;
    }

    /**
     * Resolve deduplicated [business_id => canonical_gender] map for a Business query.
     * Checks direct gender column on `businesses` first, then falls back to `business_indicators`.
     * Guarantees each business_id is evaluated at most once.
     *
     * @return array<int, string>
     */
    public static function resolveBusinessGenderMap(Builder $baseQuery): array
    {
        $cloned = (clone $baseQuery)->setEagerLoads([])->reorder();

        $hasDirectColumn = self::hasDirectGenderColumn();
        $directColName = self::getDirectGenderColumnName();
        $hasIndicatorsTable = false;
        try {
            $hasIndicatorsTable = Schema::hasTable('business_indicators');
        } catch (\Throwable $e) {
            $hasIndicatorsTable = false;
        }

        $businessMap = [];

        if ($hasDirectColumn && $directColName) {
            $rows = (clone $cloned)
                ->select('businesses.id', "businesses.{$directColName} as raw_gender")
                ->distinct()
                ->get();

            foreach ($rows as $row) {
                $bId = (int) $row->id;
                $g = self::normalize(isset($row->raw_gender) ? (string) $row->raw_gender : null);
                if (!isset($businessMap[$bId]) || ($businessMap[$bId] === self::UNKNOWN && $g !== self::UNKNOWN)) {
                    $businessMap[$bId] = $g;
                }
            }
        }

        if ($hasIndicatorsTable) {
            $indicatorRows = DB::table('business_indicators')
                ->joinSub(
                    (clone $cloned)->select('businesses.id')->distinct(),
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

            foreach ($indicatorRows as $indRow) {
                $bId = (int) $indRow->business_id;
                $current = $businessMap[$bId] ?? self::UNKNOWN;
                if ($current === self::UNKNOWN) {
                    $g = self::normalize(isset($indRow->nilai) ? (string) $indRow->nilai : null);
                    $businessMap[$bId] = $g;
                }
            }
        }

        return $businessMap;
    }

    /**
     * Calculate gender recapitulation for a Business query builder without double-counting any business.
     */
    public static function aggregateForBusinessQuery(Builder $baseQuery): array
    {
        $cloned = (clone $baseQuery)->setEagerLoads([])->reorder();

        $totalAll = (clone $cloned)->distinct()->count('businesses.id');
        if ($totalAll === 0) {
            return self::buildRecapPayload(0, 0, 0, [
                'source_available' => self::hasDirectGenderColumn(),
                'source_note' => 'Data gender diambil dari field jenis_kelamin / indikator usaha yang tersedia.',
            ]);
        }

        $hasDirectColumn = self::hasDirectGenderColumn();
        $businessMap = self::resolveBusinessGenderMap($cloned);

        $lakiLaki = 0;
        $perempuan = 0;

        foreach ($businessMap as $gender) {
            if ($gender === self::MALE) {
                $lakiLaki++;
            } elseif ($gender === self::FEMALE) {
                $perempuan++;
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
     * Resolve deduplicated [visitor_key => canonical_gender] map from a PublicMapAccessLog query.
     * Deduplicates by verified NIK (or normalized nama + instansi for legacy rows without NIK)
     * so the same visitor is NEVER counted twice.
     *
     * @return array<string, string>
     */
    public static function resolveAccessLogsVisitorGenderMap(Builder $baseQuery): array
    {
        $cloned = (clone $baseQuery)->setEagerLoads([])->reorder();

        $hasNikCol = false;
        $hasGenderCol = false;
        try {
            $hasNikCol = Schema::hasColumn('public_map_access_logs', 'nik');
            $hasGenderCol = Schema::hasColumn('public_map_access_logs', 'jenis_kelamin');
        } catch (\Throwable $e) {
            // Ignore schema inspection errors
        }

        $selectCols = ['public_map_access_logs.id', 'public_map_access_logs.nama', 'public_map_access_logs.instansi'];
        if ($hasNikCol) {
            $selectCols[] = 'public_map_access_logs.nik';
        }
        if ($hasGenderCol) {
            $selectCols[] = 'public_map_access_logs.jenis_kelamin';
        }

        $rows = $cloned
            ->orderByDesc('public_map_access_logs.accessed_at')
            ->orderByDesc('public_map_access_logs.id')
            ->get($selectCols);

        $visitorMap = [];
        foreach ($rows as $row) {
            $nik = $hasNikCol ? trim((string) ($row->nik ?? '')) : '';
            if ($nik !== '') {
                $visitorKey = 'nik:' . $nik;
            } else {
                $namaNorm = strtolower(trim((string) ($row->nama ?? '')));
                $instansiNorm = strtolower(trim((string) ($row->instansi ?? '')));
                $visitorKey = ($namaNorm !== '' || $instansiNorm !== '')
                    ? "visitor:{$namaNorm}:::{$instansiNorm}"
                    : 'id:' . $row->id;
            }

            $rawGender = $hasGenderCol ? ($row->jenis_kelamin ?? null) : null;
            $normalized = self::normalize($rawGender !== null ? (string) $rawGender : null);

            if (!isset($visitorMap[$visitorKey])) {
                $visitorMap[$visitorKey] = $normalized;
            } elseif ($visitorMap[$visitorKey] === self::UNKNOWN && $normalized !== self::UNKNOWN) {
                $visitorMap[$visitorKey] = $normalized;
            }
        }

        return $visitorMap;
    }

    /**
     * Calculate gender recapitulation for a PublicMapAccessLog query builder without double-counting any visitor.
     */
    public static function aggregateForAccessLogsQuery(Builder $baseQuery): array
    {
        $visitorMap = self::resolveAccessLogsVisitorGenderMap($baseQuery);

        $lakiLaki = 0;
        $perempuan = 0;
        $tidakDiketahui = 0;

        foreach ($visitorMap as $gender) {
            if ($gender === self::MALE) {
                $lakiLaki++;
            } elseif ($gender === self::FEMALE) {
                $perempuan++;
            } else {
                $tidakDiketahui++;
            }
        }

        $hasGenderCol = false;
        try {
            $hasGenderCol = Schema::hasColumn('public_map_access_logs', 'jenis_kelamin');
        } catch (\Throwable $e) {
            $hasGenderCol = false;
        }

        return self::buildRecapPayload($lakiLaki, $perempuan, $tidakDiketahui, [
            'source_available' => $hasGenderCol || ($lakiLaki + $perempuan > 0),
            'source_note' => 'Data gender pengunjung bersumber dari field jenis_kelamin hasil verifikasi NIK Dukcapil (dihitung per pengunjung unik tanpa duplikasi). Data kosong atau tidak dikenal dikategorikan sebagai Belum Diisi / Tidak Diketahui.',
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
