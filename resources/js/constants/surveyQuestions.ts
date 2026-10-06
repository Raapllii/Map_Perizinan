export interface SurveyOption {
  label: string;
  score: number;
}

export interface SurveyQuestion {
  key: string;
  number: number;
  name: string;
  question: string;
  options: SurveyOption[];
}

export const SERVICE_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    key: "persyaratan",
    number: 1,
    name: "Persyaratan",
    question: "Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya?",
    options: [
      { label: "Sangat Sesuai", score: 4 },
      { label: "Sesuai", score: 3 },
      { label: "Kurang Sesuai", score: 2 },
    ],
  },
  {
    key: "prosedur",
    number: 2,
    name: "Sistem, Mekanisme, dan Prosedur",
    question: "Bagaimana pendapat Saudara tentang kemudahan prosedur pelayanan di unit ini?",
    options: [
      { label: "Sangat Mudah", score: 4 },
      { label: "Mudah", score: 3 },
      { label: "Kurang Mudah", score: 2 },
    ],
  },
  {
    key: "waktu",
    number: 3,
    name: "Waktu Penyelesaian",
    question: "Bagaimana pendapat Saudara tentang kecepatan waktu dalam memberikan pelayanan?",
    options: [
      { label: "Sangat Cepat", score: 4 },
      { label: "Cepat", score: 3 },
      { label: "Kurang Cepat", score: 2 },
    ],
  },
  {
    key: "biaya",
    number: 4,
    name: "Biaya/Tarif",
    question: "Bagaimana pendapat Saudara tentang kewajaran biaya/tarif dalam pelayanan?",
    options: [
      { label: "Sangat Wajar", score: 4 },
      { label: "Wajar", score: 3 },
      { label: "Kurang Wajar", score: 2 },
      { label: "Tidak Wajar", score: 1 },
    ],
  },
  {
    key: "produk",
    number: 5,
    name: "Produk Spesifikasi Jenis Pelayanan",
    question: "Bagaimana pendapat Saudara tentang kesesuaian hasil pelayanan yang diterima?",
    options: [
      { label: "Sangat Sesuai", score: 4 },
      { label: "Sesuai", score: 3 },
      { label: "Kurang Sesuai", score: 2 },
    ],
  },
  {
    key: "kompetensi",
    number: 6,
    name: "Kompetensi Pelaksana",
    question: "Bagaimana pendapat Saudara tentang kemampuan/kompetensi petugas dalam memberikan pelayanan?",
    options: [
      { label: "Sangat Kompeten", score: 4 },
      { label: "Kompeten", score: 3 },
      { label: "Kurang Kompeten", score: 2 },
    ],
  },
  {
    key: "perilaku",
    number: 7,
    name: "Perilaku Pelaksana",
    question: "Bagaimana pendapat Saudara tentang perilaku petugas dalam memberikan pelayanan?",
    options: [
      { label: "Sangat Sopan dan Ramah", score: 4 },
      { label: "Sopan dan Ramah", score: 3 },
      { label: "Kurang Sopan dan Ramah", score: 2 },
    ],
  },
  {
    key: "pengaduan",
    number: 8,
    name: "Penanganan Pengaduan, Saran, dan Masukan",
    question: "Bagaimana pendapat Saudara tentang penanganan pengaduan dan masukan oleh unit layanan ini?",
    options: [
      { label: "Dikelola dengan Sangat Baik", score: 4 },
      { label: "Dikelola dengan Baik", score: 3 },
      { label: "Dikelola dengan Kurang Baik", score: 2 },
    ],
  },
  {
    key: "sarana",
    number: 9,
    name: "Sarana dan Prasarana",
    question: "Bagaimana pendapat Saudara tentang kualitas sarana dan prasarana di unit layanan ini?",
    options: [
      { label: "Sangat Baik", score: 4 },
      { label: "Baik", score: 3 },
      { label: "Kurang Baik", score: 2 },
    ],
  },
];
