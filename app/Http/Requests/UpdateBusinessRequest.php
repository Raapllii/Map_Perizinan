<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            // Identitas Proyek
            'id_proyek' => 'nullable|string',
            'nib' => 'nullable|string',
            'nama_perusahaan' => 'nullable|string',
            'nama_proyek' => 'nullable|string',
            'uraian_jenis_proyek' => 'nullable|string',
            'tanggal_terbit_oss' => 'nullable|date',
            'day_of_tanggal_pengajuan_proyek' => 'nullable|string',

            // Klasifikasi Usaha
            'kbli' => 'nullable|string',
            'judul_kbli' => 'nullable|string',
            'kl_sektor_pembina' => 'nullable|string',
            'uraian_jenis_perusahaan' => 'nullable|string',
            'uraian_status_penanaman_modal' => 'nullable|string',
            'uraian_risiko_proyek' => 'nullable|string',
            'uraian_skala_usaha' => 'nullable|string',

            // Lokasi Usaha
            'alamat_usaha' => 'nullable|string',
            'kab_kota_usaha' => 'nullable|string',
            'kecamatan_usaha' => 'nullable|string',
            'kelurahan_usaha' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            
            // Tanah, Investasi & TKI
            'luas_tanah' => 'nullable|numeric',
            'satuan_tanah' => 'nullable|string',
            'jumlah_investasi' => 'nullable|numeric',
            'tki' => 'nullable|integer',

            // Kontak & Pengguna
            'nama_user' => 'nullable|string',
            'email' => 'nullable|string',
            'nomor_telp' => 'nullable|string',

            // System Internal
            'status' => 'nullable|string',
            'color' => 'nullable|string',

            // 10 Indikator Fleksibel (Legacy Columns)
            'indicator_1' => 'nullable|string|max:2000',
            'indicator_2' => 'nullable|string|max:2000',
            'indicator_3' => 'nullable|string|max:2000',
            'indicator_4' => 'nullable|string|max:2000',
            'indicator_5' => 'nullable|string|max:2000',
            'indicator_6' => 'nullable|string|max:2000',
            'indicator_7' => 'nullable|string|max:2000',
            'indicator_8' => 'nullable|string|max:2000',
            'indicator_9' => 'nullable|string|max:2000',
            'indicator_10' => 'nullable|string|max:2000',

            // Indikator Per Usaha (Relasi business_indicators)
            'indicators' => 'nullable|array',
            'indicators.*.id' => 'nullable|integer',
            'indicators.*.judul' => 'required|string|max:255',
            'indicators.*.nilai' => 'nullable|string|max:5000',
            'indicators.*.sort_order' => 'nullable|integer',
        ];
    }
}
