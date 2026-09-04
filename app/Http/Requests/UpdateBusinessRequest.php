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
            'id_proyek' => 'nullable|string',
            'nib' => 'nullable|string',
            'nama_perusahaan' => 'nullable|string',
            'uraian_risiko_proyek' => 'nullable|string',
            'kbli' => 'nullable|string',
            'judul_kbli' => 'nullable|string',
            'alamat_usaha' => 'nullable|string',
            'kecamatan_usaha' => 'nullable|string',
            'kelurahan_usaha' => 'nullable|string',
            'uraian_status_penanaman_modal' => 'nullable|string',
            'status' => 'nullable|string',
            'tanggal_terbit_oss' => 'nullable|date',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'color' => 'nullable|string',
            'jumlah_investasi' => 'nullable|numeric',
            'luas_tanah' => 'nullable|numeric',
            'tki' => 'nullable|integer',
        ];
    }
}
