<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Detail Data Usaha - {{ $business->nama_perusahaan ?? 'Usaha' }}</title>
    <style>
        @page {
            margin: 18mm 16mm 20mm 16mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 9.5pt;
            line-height: 1.45;
            margin: 0;
            padding: 0;
        }

        /* HEADER */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 10px;
        }

        .header-title-main {
            font-size: 15pt;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0;
        }

        .header-subtitle {
            font-size: 9pt;
            color: #64748b;
            margin-top: 2px;
            letter-spacing: 0.3px;
        }

        .header-meta {
            text-align: right;
            font-size: 8pt;
            color: #64748b;
            vertical-align: middle;
        }

        /* BUSINESS CARD TITLE */
        .company-banner {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #0284c7;
            padding: 10px 14px;
            margin-bottom: 14px;
            border-radius: 4px;
        }

        .company-name {
            font-size: 13.5pt;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 3px 0;
            text-transform: uppercase;
        }

        .project-name {
            font-size: 9.5pt;
            color: #475569;
            font-weight: 600;
            margin: 0 0 6px 0;
        }

        /* BADGES */
        .badge {
            display: inline-block;
            padding: 2.5px 8px;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-radius: 3px;
            margin-right: 6px;
        }

        .badge-status {
            background-color: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
        }

        .badge-risk {
            background-color: {{ $riskConfig['bg'] ?? '#f1f5f9' }};
            color: {{ $riskConfig['color'] ?? '#475569' }};
            border: 1px solid {{ $riskConfig['border'] ?? '#cbd5e1' }};
        }

        /* SECTIONS */
        .section-header {
            background-color: #f1f5f9;
            color: #0f172a;
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 5px 10px;
            margin-top: 14px;
            margin-bottom: 6px;
            border-left: 3px solid #0284c7;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .data-table tr {
            border-bottom: 1px solid #f1f5f9;
        }

        .data-table td {
            padding: 5.5px 8px;
            vertical-align: top;
        }

        .data-table .label {
            width: 32%;
            font-size: 8.5pt;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.2px;
        }

        .data-table .value {
            width: 68%;
            font-size: 9.5pt;
            color: #0f172a;
            font-weight: 500;
        }

        .mono {
            font-family: 'Courier New', Courier, monospace;
            font-weight: 600;
            letter-spacing: 0.3px;
        }

        /* INDICATORS TABLE */
        .indicator-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 8px;
        }

        .indicator-table th {
            background-color: #f8fafc;
            color: #475569;
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
        }

        .indicator-table td {
            font-size: 9pt;
            color: #1e293b;
            padding: 5.5px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }

        .indicator-table tr:nth-child(even) td {
            background-color: #fafafa;
        }

        /* FOOTER */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 18px;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            font-size: 7.5pt;
            color: #94a3b8;
            text-align: center;
        }

        .text-muted {
            color: #94a3b8;
            font-style: italic;
        }
    </style>
</head>
<body>

    <!-- HEADER DOKUMEN RESMI -->
    <table class="header-table">
        <tr>
            <td style="width: 70%;">
                <div class="header-title-main">Map Perizinan</div>
                <div class="header-subtitle">Dokumen Informasi Detail Data Usaha</div>
            </td>
            <td class="header-meta">
                <div>Tanggal Unduh:</div>
                <div style="font-weight: 600; color: #334155; margin-top: 1px;">{{ $generatedAt }}</div>
            </td>
        </tr>
    </table>

    <!-- IDENTITAS PERUSAHAAN BANNER -->
    <div class="company-banner">
        <div class="company-name">{{ $business->nama_perusahaan ?? '-' }}</div>
        @if(!empty($business->nama_proyek) && trim(strtolower($business->nama_proyek)) !== trim(strtolower($business->nama_perusahaan ?? '')))
            <div class="project-name">Proyek: {{ $business->nama_proyek }}</div>
        @endif
        <div style="margin-top: 4px;">
            <span class="badge badge-status">{{ $business->status ?? 'Aktif' }}</span>
            <span class="badge badge-risk">Risiko: {{ $riskConfig['category'] ?? ($business->uraian_risiko_proyek ?? 'Tidak Ada Data') }}</span>
        </div>
    </div>

    <!-- 1. INFORMASI USAHA -->
    <div class="section-header">Informasi Usaha</div>
    <table class="data-table">
        <tr>
            <td class="label">Nama Perusahaan</td>
            <td class="value"><strong>{{ $business->nama_perusahaan ?? '-' }}</strong></td>
        </tr>
        <tr>
            <td class="label">Nama Proyek</td>
            <td class="value">{{ $business->nama_proyek ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Nomor Induk Berusaha (NIB)</td>
            <td class="value mono">{{ $business->nib ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Kode KBLI</td>
            <td class="value mono">{{ $business->kbli ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Judul KBLI</td>
            <td class="value">{{ $business->judul_kbli ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Sektor Pembina</td>
            <td class="value">{{ $business->kl_sektor_pembina ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Bentuk / Jenis Usaha</td>
            <td class="value">{{ $business->uraian_jenis_perusahaan ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Skala Usaha</td>
            <td class="value">{{ $business->uraian_skala_usaha ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Status Penanaman Modal</td>
            <td class="value">{{ $business->uraian_status_penanaman_modal ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tingkat Risiko</td>
            <td class="value">
                <span class="badge badge-risk" style="margin: 0;">
                    {{ $riskConfig['category'] ?? ($business->uraian_risiko_proyek ?? '-') }}
                </span>
            </td>
        </tr>
        @if(!empty($business->day_of_tanggal_pengajuan_proyek))
        <tr>
            <td class="label">Tgl Pengajuan Proyek</td>
            <td class="value">{{ $business->day_of_tanggal_pengajuan_proyek }}</td>
        </tr>
        @endif
        @if(!empty($business->tanggal_terbit_oss))
        <tr>
            <td class="label">Tgl Terbit OSS</td>
            <td class="value">
                @php
                    $tglOss = '-';
                    try {
                        $tglOss = \Carbon\Carbon::parse($business->tanggal_terbit_oss)->locale('id')->translatedFormat('d F Y');
                    } catch (\Exception $e) {
                        $tglOss = (string)$business->tanggal_terbit_oss;
                    }
                @endphp
                {{ $tglOss }}
            </td>
        </tr>
        @endif
    </table>

    <!-- 2. LOKASI USAHA -->
    <div class="section-header">Lokasi Usaha</div>
    <table class="data-table">
        <tr>
            <td class="label">Alamat Lengkap</td>
            <td class="value">{{ $business->alamat_usaha ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Kelurahan / Desa</td>
            <td class="value">{{ $business->kelurahan_usaha ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Kecamatan</td>
            <td class="value">{{ $business->kecamatan_usaha ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Kabupaten / Kota</td>
            <td class="value">{{ $business->kab_kota_usaha ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Titik Koordinat</td>
            <td class="value">
                @if($hasCoordinates && $formattedCoords)
                    <span class="mono">Latitude: {{ $formattedCoords['latitude'] }}, Longitude: {{ $formattedCoords['longitude'] }}</span>
                @else
                    <span class="text-muted">Belum dipetakan (koordinat spasial belum tersedia)</span>
                @endif
            </td>
        </tr>
    </table>

    <!-- 3. TANAH, INVESTASI & TENAGA KERJA -->
    @if(!empty($business->luas_tanah) || !empty($business->jumlah_investasi) || !empty($business->tki))
    <div class="section-header">Tanah, Investasi & Tenaga Kerja</div>
    <table class="data-table">
        <tr>
            <td class="label">Luas Tanah</td>
            <td class="value">
                @if(!empty($business->luas_tanah))
                    {{ number_format($business->luas_tanah, 0, ',', '.') }} {{ $business->satuan_tanah ?? 'm2' }}
                @else
                    -
                @endif
            </td>
        </tr>
        <tr>
            <td class="label">Jumlah Investasi</td>
            <td class="value">
                @if(!empty($business->jumlah_investasi))
                    Rp {{ number_format($business->jumlah_investasi, 0, ',', '.') }}
                @else
                    -
                @endif
            </td>
        </tr>
        <tr>
            <td class="label">Tenaga Kerja Indonesia (TKI)</td>
            <td class="value">
                @if(!empty($business->tki))
                    {{ $business->tki }} Orang
                @else
                    -
                @endif
            </td>
        </tr>
    </table>
    @endif

    <!-- 4. INDIKATOR USAHA DINAMIS -->
    <div class="section-header">Indikator Usaha</div>
    @if(!empty($indicators) && count($indicators) > 0)
        <table class="indicator-table">
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">No</th>
                    <th style="width: 46%;">Indikator</th>
                    <th style="width: 46%;">Nilai / Keterangan</th>
                </tr>
            </thead>
            <tbody>
                @foreach($indicators as $idx => $ind)
                <tr>
                    <td style="text-align: center; color: #64748b;">{{ $idx + 1 }}</td>
                    <td><strong>{{ $ind['judul'] }}</strong></td>
                    <td>{{ $ind['nilai'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div style="padding: 10px 8px; font-size: 9pt; color: #64748b; font-style: italic; border: 1px dashed #e2e8f0; border-radius: 4px; margin-top: 4px;">
            Tidak ada indikator tambahan yang tercatat untuk data usaha ini.
        </div>
    @endif

    <!-- FOOTER RESMI -->
    <div class="footer">
        Dokumen ini diterbitkan secara otomatis melalui Sistem Informasi Geografis Map Perizinan. Informasi bersumber dari basis data publik resmi.
    </div>

</body>
</html>
