<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $appends = [
        'lat', 'lng', 'kecamatan', 'kelurahan', 'alamat_proyek', 
        'risiko', 'risiko_proyek', 'kategori', 'status_pm', 
        'skala_usaha', 'tgl_terbit'
    ];

    public function getLatAttribute() { return $this->latitude; }
    public function getLngAttribute() { return $this->longitude; }
    public function getKecamatanAttribute() { return $this->kecamatan_usaha; }
    public function getKelurahanAttribute() { return $this->kelurahan_usaha; }
    public function getAlamatProyekAttribute() { return $this->alamat_usaha; }
    public function getRisikoAttribute() { return $this->uraian_risiko_proyek; }
    public function getRisikoProyekAttribute() { return $this->uraian_risiko_proyek; }
    public function getKategoriAttribute() { return $this->judul_kbli; }
    public function getStatusPmAttribute() { return $this->uraian_status_penanaman_modal; }
    public function getSkalaUsahaAttribute() { return $this->uraian_skala_usaha; }
    public function getTglTerbitAttribute() { return $this->tanggal_terbit_oss; }
}
