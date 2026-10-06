<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\PublicMapAccessLog;
use App\Models\PublicMapServiceSurvey;
use App\Models\PublicMapServiceSurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PublicMapServiceSurveyController extends Controller
{
    /**
     * Definition of the 9 service indicators.
     */
    public static function getIndicatorDefinitions(): array
    {
        return [
            'persyaratan' => [
                'name' => 'Persyaratan',
                'question' => 'Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya?',
                'options' => [
                    'Sangat Sesuai' => 4,
                    'Sesuai' => 3,
                    'Kurang Sesuai' => 2,
                ],
            ],
            'prosedur' => [
                'name' => 'Sistem, Mekanisme, dan Prosedur',
                'question' => 'Bagaimana pendapat Saudara tentang kemudahan prosedur pelayanan di unit ini?',
                'options' => [
                    'Sangat Mudah' => 4,
                    'Mudah' => 3,
                    'Kurang Mudah' => 2,
                ],
            ],
            'waktu' => [
                'name' => 'Waktu Penyelesaian',
                'question' => 'Bagaimana pendapat Saudara tentang kecepatan waktu dalam memberikan pelayanan?',
                'options' => [
                    'Sangat Cepat' => 4,
                    'Cepat' => 3,
                    'Kurang Cepat' => 2,
                ],
            ],
            'biaya' => [
                'name' => 'Biaya/Tarif',
                'question' => 'Bagaimana pendapat Saudara tentang kewajaran biaya/tarif dalam pelayanan?',
                'options' => [
                    'Sangat Wajar' => 4,
                    'Wajar' => 3,
                    'Kurang Wajar' => 2,
                    'Tidak Wajar' => 1,
                ],
            ],
            'produk' => [
                'name' => 'Produk Spesifikasi Jenis Pelayanan',
                'question' => 'Bagaimana pendapat Saudara tentang kesesuaian hasil pelayanan yang diterima?',
                'options' => [
                    'Sangat Sesuai' => 4,
                    'Sesuai' => 3,
                    'Kurang Sesuai' => 2,
                ],
            ],
            'kompetensi' => [
                'name' => 'Kompetensi Pelaksana',
                'question' => 'Bagaimana pendapat Saudara tentang kemampuan/kompetensi petugas dalam memberikan pelayanan?',
                'options' => [
                    'Sangat Kompeten' => 4,
                    'Kompeten' => 3,
                    'Kurang Kompeten' => 2,
                ],
            ],
            'perilaku' => [
                'name' => 'Perilaku Pelaksana',
                'question' => 'Bagaimana pendapat Saudara tentang perilaku petugas dalam memberikan pelayanan?',
                'options' => [
                    'Sangat Sopan dan Ramah' => 4,
                    'Sopan dan Ramah' => 3,
                    'Kurang Sopan dan Ramah' => 2,
                ],
            ],
            'pengaduan' => [
                'name' => 'Penanganan Pengaduan, Saran, dan Masukan',
                'question' => 'Bagaimana pendapat Saudara tentang penanganan pengaduan dan masukan oleh unit layanan ini?',
                'options' => [
                    'Dikelola dengan Sangat Baik' => 4,
                    'Dikelola dengan Baik' => 3,
                    'Dikelola dengan Kurang Baik' => 2,
                ],
            ],
            'sarana' => [
                'name' => 'Sarana dan Prasarana',
                'question' => 'Bagaimana pendapat Saudara tentang kualitas sarana dan prasarana di unit layanan ini?',
                'options' => [
                    'Sangat Baik' => 4,
                    'Baik' => 3,
                    'Kurang Baik' => 2,
                ],
            ],
        ];
    }

    /**
     * Store visitor survey responses before downloading business detail.
     */
    public function store(Request $request)
    {
        $definitions = self::getIndicatorDefinitions();
        $requiredKeys = array_keys($definitions);

        $validator = Validator::make($request->all(), [
            'access_log_id' => 'required|integer|exists:public_map_access_logs,id',
            'business_id' => 'required|integer|exists:businesses,id',
            'answers' => 'required|array',
        ], [
            'access_log_id.required' => 'Identitas akses peta (access_log_id) wajib disertakan.',
            'access_log_id.exists' => 'Data log akses tidak ditemukan.',
            'business_id.required' => 'ID data usaha wajib disertakan.',
            'business_id.exists' => 'Data usaha tidak ditemukan.',
            'answers.required' => 'Silakan lengkapi seluruh indikator sebelum mengunduh detail usaha.',
            'answers.array' => 'Format jawaban tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $answers = $request->input('answers', []);

        // Strict validation: All 9 indicators MUST be present and answered
        $missingKeys = [];
        $validatedResponses = [];
        $totalScore = 0;

        foreach ($definitions as $key => $def) {
            if (!isset($answers[$key]) || !is_array($answers[$key])) {
                $missingKeys[] = $key;
                continue;
            }

            $userAnswer = trim($answers[$key]['answer'] ?? '');
            $userScore = $answers[$key]['score'] ?? null;

            // Check if user answer matches valid option
            if (empty($userAnswer) || !array_key_exists($userAnswer, $def['options'])) {
                $missingKeys[] = $key;
                continue;
            }

            $expectedScore = $def['options'][$userAnswer];
            $scoreToRecord = ($userScore !== null && (int)$userScore === $expectedScore) ? (int)$userScore : $expectedScore;

            $totalScore += $scoreToRecord;
            $validatedResponses[$key] = [
                'indicator_key' => $key,
                'indicator_name' => $def['name'],
                'question' => $def['question'],
                'answer_label' => $userAnswer,
                'score' => $scoreToRecord,
            ];
        }

        if (!empty($missingKeys)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan lengkapi seluruh indikator sebelum mengunduh detail usaha.',
                'missing_indicators' => $missingKeys,
                'errors' => [
                    'answers' => ['Silakan lengkapi seluruh indikator sebelum mengunduh detail usaha.'],
                ],
            ], 422);
        }

        $count = count($validatedResponses);
        $averageScore = $count > 0 ? round($totalScore / $count, 2) : 0;

        // Persist survey and detailed responses in a single transaction
        $survey = DB::transaction(function () use ($request, $totalScore, $averageScore, $validatedResponses) {
            $surveyRecord = PublicMapServiceSurvey::create([
                'public_map_access_log_id' => $request->input('access_log_id'),
                'business_id' => $request->input('business_id'),
                'total_score' => $totalScore,
                'average_score' => $averageScore,
            ]);

            foreach ($validatedResponses as $res) {
                PublicMapServiceSurveyResponse::create([
                    'survey_id' => $surveyRecord->id,
                    'public_map_access_log_id' => $request->input('access_log_id'),
                    'business_id' => $request->input('business_id'),
                    'indicator_key' => $res['indicator_key'],
                    'indicator_name' => $res['indicator_name'],
                    'question' => $res['question'],
                    'answer_label' => $res['answer_label'],
                    'score' => $res['score'],
                ]);
            }

            return $surveyRecord;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Survey berhasil disimpan. Detail usaha sedang diunduh.',
            'data' => [
                'survey_id' => $survey->id,
                'business_id' => $survey->business_id,
                'total_score' => $survey->total_score,
                'average_score' => $survey->average_score,
            ],
        ], 201);
    }

    /**
     * Mask NIK for privacy compliance (e.g., 320**********001).
     */
    public static function maskNik(?string $nik): string
    {
        if (!$nik) {
            return '-';
        }
        $len = strlen($nik);
        if ($len <= 6) {
            return substr($nik, 0, 2) . str_repeat('*', max(1, $len - 2));
        }
        $prefix = substr($nik, 0, 3);
        $suffix = substr($nik, -3);
        $maskedLength = max(1, $len - 6);
        return $prefix . str_repeat('*', $maskedLength) . $suffix;
    }

    /**
     * Determine service quality letter (Mutu Pelayanan) based on IKM Konversi (PermenPAN-RB No. 14/2017).
     */
    public static function getMutuPelayanan(float $ikmKonversi): array
    {
        if ($ikmKonversi <= 0) {
            return ['mutu' => '-', 'kategori' => 'Belum Ada Data'];
        }
        if ($ikmKonversi >= 88.31) {
            return ['mutu' => 'A', 'kategori' => 'Sangat Baik'];
        }
        if ($ikmKonversi >= 76.61) {
            return ['mutu' => 'B', 'kategori' => 'Baik'];
        }
        if ($ikmKonversi >= 65.00) {
            return ['mutu' => 'C', 'kategori' => 'Kurang Baik'];
        }
        return ['mutu' => 'D', 'kategori' => 'Tidak Baik'];
    }

    /**
     * Admin: Detail Jawaban Per Pertanyaan (Hasil Isian Asli Responden).
     * Server-side paginated list of each respondent's actual response.
     */
    public function indexResponses(Request $request)
    {
        $query = PublicMapServiceSurveyResponse::with([
            'accessLog',
            'business',
            'survey'
        ]);

        // Filter: Unsur / Pertanyaan
        if ($request->filled('indicator_key') && $request->input('indicator_key') !== 'Semua') {
            $query->where('indicator_key', $request->input('indicator_key'));
        }

        // Filter: Tahun
        if ($request->filled('year') && $request->input('year') !== 'Semua') {
            $query->whereYear('created_at', $request->input('year'));
        }

        // Filter: Rentang Tanggal
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        // Filter: Instansi
        if ($request->filled('instansi') && $request->input('instansi') !== 'Semua') {
            $instansi = $request->input('instansi');
            $query->whereHas('accessLog', function ($q) use ($instansi) {
                $q->where('instansi', $instansi);
            });
        }

        // Search: Responden, Instansi, Pertanyaan, Jawaban, Nama Usaha
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereHas('accessLog', function ($sub) use ($search) {
                    $sub->where('nama', 'like', "%{$search}%")
                        ->orWhere('instansi', 'like', "%{$search}%");
                })
                ->orWhere('indicator_name', 'like', "%{$search}%")
                ->orWhere('question', 'like', "%{$search}%")
                ->orWhere('answer_label', 'like', "%{$search}%")
                ->orWhereHas('business', function ($sub) use ($search) {
                    $sub->where('nama_perusahaan', 'like', "%{$search}%");
                });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $paginator = $query->orderBy('id', 'desc')->paginate($perPage);

        $transformedData = collect($paginator->items())->map(function ($res) {
            return [
                'id' => $res->id,
                'survey_id' => $res->survey_id,
                'nama_responden' => $res->accessLog->nama ?? 'Pengunjung',
                'instansi' => $res->accessLog->instansi ?? '-',
                'nik_masked' => self::maskNik($res->accessLog->nik ?? null),
                'indicator_key' => $res->indicator_key,
                'indicator_name' => $res->indicator_name,
                'question' => $res->question,
                'answer_label' => $res->answer_label,
                'score' => (int) $res->score,
                'business_id' => $res->business_id,
                'business_name' => $res->business->nama_perusahaan ?? '-',
                'created_at' => $res->created_at ? $res->created_at->toISOString() : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'current_page' => $paginator->currentPage(),
                'data' => $transformedData,
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Admin: Detail Satu Pengisian Survei Utuh (9 Jawaban dari 1 Sesi Responden).
     */
    public function showSurvey($id)
    {
        $survey = PublicMapServiceSurvey::with([
            'accessLog',
            'business',
            'responses' => function ($q) {
                $q->orderBy('id', 'asc');
            }
        ])->findOrFail($id);

        $definitions = self::getIndicatorDefinitions();
        $orderedKeys = array_keys($definitions);

        // Sort responses according to U1..U9 definition order
        $sortedResponses = $survey->responses->sortBy(function ($item) use ($orderedKeys) {
            $pos = array_search($item->indicator_key, $orderedKeys);
            return $pos === false ? 99 : $pos;
        })->values();

        $responseItems = [];
        $no = 1;
        foreach ($sortedResponses as $res) {
            $responseItems[] = [
                'no' => $no++,
                'id' => $res->id,
                'indicator_key' => $res->indicator_key,
                'indicator_name' => $res->indicator_name,
                'question' => $res->question,
                'answer_label' => $res->answer_label,
                'score' => (int) $res->score,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $survey->id,
                'nama_responden' => $survey->accessLog->nama ?? 'Pengunjung',
                'instansi' => $survey->accessLog->instansi ?? '-',
                'nik_masked' => self::maskNik($survey->accessLog->nik ?? null),
                'business_id' => $survey->business_id,
                'business_name' => $survey->business->nama_perusahaan ?? '-',
                'business_nib' => $survey->business->nib ?? '-',
                'total_score' => (int) $survey->total_score,
                'average_score' => (float) $survey->average_score,
                'created_at' => $survey->created_at ? $survey->created_at->toISOString() : null,
                'responses' => $responseItems,
            ],
        ]);
    }

    /**
     * Admin: Rekapitulasi Survei, Nilai IKM Per Unsur, dan Nilai IKM Per Bulan.
     */
    public function recap(Request $request)
    {
        $definitions = self::getIndicatorDefinitions();
        $totalIndicators = count($definitions); // 9
        $bobotUnsur = round(1 / max(1, $totalIndicators), 3); // 0.111

        // Base Survey Query
        $surveyQuery = PublicMapServiceSurvey::query();

        if ($request->filled('year') && $request->input('year') !== 'Semua') {
            $surveyQuery->whereYear('created_at', $request->input('year'));
        }
        if ($request->filled('start_date')) {
            $surveyQuery->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $surveyQuery->whereDate('created_at', '<=', $request->input('end_date'));
        }
        if ($request->filled('instansi') && $request->input('instansi') !== 'Semua') {
            $instansi = $request->input('instansi');
            $surveyQuery->whereHas('accessLog', function ($q) use ($instansi) {
                $q->where('instansi', $instansi);
            });
        }

        $totalSurveys = (clone $surveyQuery)->count();
        $overallAverage = (clone $surveyQuery)->avg('average_score') ?? 0;
        $totalResponses = PublicMapServiceSurveyResponse::whereIn('survey_id', (clone $surveyQuery)->select('id'))->count();

        // 1. REKAP JAWABAN (Distribusi pilihan jawaban untuk setiap indikator)
        $indicatorsRecap = [];
        // 2. NILAI IKM PER UNSUR PELAYANAN (PermenPAN-RB No. 14/2017)
        $ikmPerUnsur = [];
        $totalNrrTertimbang = 0;
        $number = 1;

        foreach ($definitions as $key => $def) {
            $responsesQuery = PublicMapServiceSurveyResponse::where('indicator_key', $key)
                ->whereIn('survey_id', (clone $surveyQuery)->select('id'));

            $countRespon = (clone $responsesQuery)->count();
            $totalNilaiUnsur = (clone $responsesQuery)->sum('score') ?? 0;
            $avgScore = $countRespon > 0 ? ($totalNilaiUnsur / $countRespon) : 0;
            $nrrTertimbang = round($avgScore * $bobotUnsur, 4);
            $totalNrrTertimbang += $nrrTertimbang;

            // Distribution per answer option
            $distribution = [];
            foreach ($def['options'] as $label => $score) {
                $count = (clone $responsesQuery)->where('answer_label', $label)->count();
                $percentage = $countRespon > 0 ? round(($count / $countRespon) * 100, 1) : 0;
                $distribution[] = [
                    'label' => $label,
                    'score' => $score,
                    'count' => $count,
                    'percentage' => $percentage,
                ];
            }

            $indicatorsRecap[] = [
                'no' => $number,
                'key' => $key,
                'name' => $def['name'],
                'question' => $def['question'],
                'total_responses' => $countRespon,
                'average_score' => round($avgScore, 2),
                'distribution' => $distribution,
            ];

            $mutuUnsur = self::getMutuPelayanan(round($avgScore * 25, 2));

            $ikmPerUnsur[] = [
                'no' => $number,
                'unsur_code' => 'U' . $number,
                'key' => $key,
                'name' => $def['name'],
                'total_nilai' => (int) $totalNilaiUnsur,
                'jumlah_responden' => (int) $countRespon,
                'nrr' => round($avgScore, 2),
                'bobot' => $bobotUnsur,
                'nrr_tertimbang' => $nrrTertimbang,
                'mutu' => $mutuUnsur['mutu'],
                'kategori' => $mutuUnsur['kategori'],
            ];

            $number++;
        }

        $totalNrrTertimbang = round($totalNrrTertimbang, 4);
        $ikmKonversi = round($totalNrrTertimbang * 25, 2);
        $overallMutu = self::getMutuPelayanan($ikmKonversi);

        // 3. NILAI IKM PER BULAN (12 Bulan untuk Tahun Terpilih)
        $selectedYear = (int) ($request->input('year') && $request->input('year') !== 'Semua' ? $request->input('year') : date('Y'));
        $monthNames = [
            1 => ['nama' => 'Januari', 'short' => 'Jan'],
            2 => ['nama' => 'Februari', 'short' => 'Feb'],
            3 => ['nama' => 'Maret', 'short' => 'Mar'],
            4 => ['nama' => 'April', 'short' => 'Apr'],
            5 => ['nama' => 'Mei', 'short' => 'Mei'],
            6 => ['nama' => 'Juni', 'short' => 'Jun'],
            7 => ['nama' => 'Juli', 'short' => 'Jul'],
            8 => ['nama' => 'Agustus', 'short' => 'Agu'],
            9 => ['nama' => 'September', 'short' => 'Sep'],
            10 => ['nama' => 'Oktober', 'short' => 'Okt'],
            11 => ['nama' => 'November', 'short' => 'Nov'],
            12 => ['nama' => 'Desember', 'short' => 'Des'],
        ];

        $ikmPerBulan = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthQuery = PublicMapServiceSurvey::whereYear('created_at', $selectedYear)
                ->whereMonth('created_at', $m);

            if ($request->filled('instansi') && $request->input('instansi') !== 'Semua') {
                $instansi = $request->input('instansi');
                $monthQuery->whereHas('accessLog', function ($q) use ($instansi) {
                    $q->where('instansi', $instansi);
                });
            }

            $monthSurveysCount = (clone $monthQuery)->count();
            $monthAvg = (clone $monthQuery)->avg('average_score') ?? 0;
            $monthIkmKonversi = round($monthAvg * 25, 2);
            $monthMutu = self::getMutuPelayanan($monthIkmKonversi);

            $ikmPerBulan[] = [
                'month' => $m,
                'month_name' => $monthNames[$m]['nama'],
                'short_name' => $monthNames[$m]['short'],
                'total_surveys' => $monthSurveysCount,
                'overall_average' => round($monthAvg, 2),
                'ikm_konversi' => $monthIkmKonversi,
                'mutu' => $monthSurveysCount > 0 ? $monthMutu['mutu'] : '-',
                'kategori' => $monthSurveysCount > 0 ? $monthMutu['kategori'] : '-',
            ];
        }

        // Available filter options
        $instansiList = PublicMapAccessLog::whereHas('surveys')
            ->distinct()
            ->whereNotNull('instansi')
            ->pluck('instansi')
            ->filter()
            ->values();

        $driver = DB::getDriverName();
        $yearExpression = $driver === 'pgsql'
            ? 'EXTRACT(YEAR FROM created_at)::integer as year'
            : ($driver === 'sqlite' ? 'strftime("%Y", created_at) as year' : 'YEAR(created_at) as year');

        $yearsList = PublicMapServiceSurvey::selectRaw($yearExpression)
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->map(fn($y) => (int) $y)
            ->toArray();

        if (empty($yearsList)) {
            $yearsList = [(int) date('Y')];
        }

        return response()->json([
            'status' => 'success',
            'meta' => [
                'total_surveys' => $totalSurveys,
                'total_responses' => $totalResponses,
                'overall_average' => round($overallAverage, 2),
                'total_nrr_tertimbang' => $totalNrrTertimbang,
                'ikm_konversi' => $ikmKonversi,
                'mutu_pelayanan' => $overallMutu['mutu'],
                'kategori_mutu' => $overallMutu['kategori'],
            ],
            'indicators' => $indicatorsRecap,
            'data' => $indicatorsRecap,
            'ikm_per_unsur' => [
                'elements' => $ikmPerUnsur,
                'total_nrr_tertimbang' => $totalNrrTertimbang,
                'ikm_konversi' => $ikmKonversi,
                'mutu' => $overallMutu['mutu'],
                'kategori' => $overallMutu['kategori'],
            ],
            'ikm_per_bulan' => $ikmPerBulan,
            'filters' => [
                'instansi_list' => $instansiList,
                'years_list' => $yearsList,
                'selected_year' => $selectedYear,
            ],
        ]);
    }
}
