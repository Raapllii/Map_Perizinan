<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBusinessRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'id_proyek' => 'nullable|string',
            'nib' => 'required|string',
            'nama_perusahaan' => 'required|string',
            'risiko' => 'nullable|string',
            'kbli' => 'nullable|string',
            'judul_kbli' => 'nullable|string',
            'alamat_proyek' => 'nullable|string',
            'kecamatan' => 'nullable|string',
            'kelurahan' => 'nullable|string',
            'status_pm' => 'nullable|string',
            'status' => 'nullable|string',
            'tgl_terbit' => 'nullable|date',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'color' => 'nullable|string',
        ];
    }
}
