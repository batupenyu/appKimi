// Types for Sistem Manajemen Kepegawaian

export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  no_seri_karpeg: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  pangkat: string;
  golongan: string;
  tmt_pangkat: string;
  jabatan: string;
  tmt_jabatan: string;
  unit_kerja: string;
  createdAt: string;
  updatedAt: string;
}

export interface AngkaIntegrasi {
  id: string;
  pegawaiId: string;
  pegawaiNama: string;
  pegawaiNip: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface Instansi {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewState =
  | "dashboard"
  | "pegawai"
  | "angka-integrasi"
  | "penilaian-angka-kredit"
  | "instansi"
  | "ak-pendidikan"
  | "cetak-akumulasi"
  | "cetak-penetapan";

// Constants for Pangkat dan golongan
export const PANGKAT_OPTIONS: Record<string, string> = {
  "Penata Muda": "III/a",
  "Penata Muda Tingkat I": "III/b",
  Penata: "III/c",
  "Penata Tingkat I": "III/d",
  Pembina: "IV/a",
  "Pembina Tingkat I": "IV/b",
  "Pembina Utama Muda": "IV/c",
  "Pembina Utama Madya": "IV/d",
  "Pembina Utama": "IV/e",
};

export const golongan_HIERARKI = [
  "III/a",
  "III/b",
  "III/c",
  "III/d",
  "IV/a",
  "IV/b",
  "IV/c",
  "IV/d",
  "IV/e",
];

// Constants for Jenjang
export const JENJANG_OPTIONS = [
  "KEAHLIAN - AHLI PERTAMA",
  "KEAHLIAN - AHLI MUDA",
  "KEAHLIAN - AHLI MADYA",
  "KEAHLIAN - AHLI UTAMA",
  "KETERAMPILAN - PEMULA",
  "KETERAMPILAN - TERAMPIL",
  "KETERAMPILAN - MAHIR",
  "KETERAMPILAN - PENYELIA",
];

// Constants for Penilaian
export type PenilaianPredikat = 
  | "sangat_baik"
  | "baik"
  | "butuh_perbaikan"
  | "kurang"
  | "sangat_kurang";

export const PENILAIAN_TO_PROSENTASE: Record<PenilaianPredikat, number> = {
  sangat_baik: 150,
  baik: 100,
  butuh_perbaikan: 75,
  kurang: 50,
  sangat_kurang: 25,
};

export const JENJANG_TO_KOEFISIEN: Record<string, number> = {
  "KEAHLIAN - AHLI PERTAMA": 12.5,
  "KEAHLIAN - AHLI MUDA": 25,
  "KEAHLIAN - AHLI MADYA": 37.5,
  "KEAHLIAN - AHLI UTAMA": 50,
  "KETERAMPILAN - PEMULA": 3.75,
  "KETERAMPILAN - TERAMPIL": 5,
  "KETERAMPILAN - MAHIR": 12.5,
  "KETERAMPILAN - PENYELIA": 25,
};

export interface PenilaianAngkaKredit {
  id: string;
  pegawaiId: string;
  instansiId: string;
  penilaiId: string;
  jenjang: string;
  predikat: PenilaianPredikat;
  tanggalAwalPenilaian: string;
  tanggalAkhirPenilaian: string;
  tanggalDitetapkan: string;
  tempatDitetapkan: string;
  // Calculated fields
  prosentase: number;
  koefisien: number;
  angkaKredit: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExcelTemplateRow {
  nama: string;
  nip: string;
  no_seri_karpeg: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  pangkat: string;
  golongan: string;
  tmt_pangkat: string;
  jabatan: string;
  tmt_jabatan: string;
  unit_kerja: string;
}

export interface AkPendidikan {
  id: string;
  pegawaiId: string;
  nama_pendidikan: string;
  jenjang: string;
  tahun_lulus: number;
  nilai_next_pangkat: number;
  calculated_value: number;
  createdAt: string;
  updatedAt: string;
}

// Constants for Jenjang Pendidikan dan Nilai Next Pangkat
export const JENJANG_PENDIDIKAN_OPTIONS = [
  { value: "S3", label: "S3", nilai: 200 },
  { value: "S2", label: "S2", nilai: 150 },
  { value: "S1/D4", label: "S1/D4", nilai: 100 },
  { value: "D3", label: "D3", nilai: 50 },
  { value: "D2", label: "D2", nilai: 25 },
  { value: "D1", label: "D1", nilai: 15 },
  { value: "SMA/SMK", label: "SMA/SMK", nilai: 10 },
];

// AK Pendidikan calculation: 25% * Nilai Next Pangkat
export function calculateAkPendidikan(nilaiNextPangkat: number): number {
  return Math.round(nilaiNextPangkat * 0.25 * 100) / 100;
}
