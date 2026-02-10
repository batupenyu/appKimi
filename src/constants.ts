// src/constants.ts

export interface ExcelTemplateRow {
  [key: string]: any;
}

export const JENJANG_PENDIDIKAN_OPTIONS: JenjangPendidikanOption[] = [
  { label: "SD", value: "sd", nilai: 1 },
  { label: "SMP", value: "smp", nilai: 2 },
  { label: "SMA", value: "sma", nilai: 3 },
  { label: "D1", value: "d1", nilai: 15 },
  { label: "D2", value: "d2", nilai: 20 },
  { label: "D3", value: "d3", nilai: 25 },
  { label: "D4/S1", value: "d4s1", nilai: 30 },
  { label: "S2", value: "s2", nilai: 50 },
  { label: "S3", value: "s3", nilai: 100 },
];

export const JENJANG_OPTIONS: JenjangOption[] = [
  { label: "Juru Muda", value: "juru_muda" },
  { label: "Juru Muda Tingkat I", value: "juru_muda_tingkat_i" },
  { label: "Juru", value: "juru" },
  { label: "Juru Tingkat I", value: "juru_tingkat_i" },
  { label: "Pengatur", value: "pengatur" },
  { label: "Pengatur Tingkat I", value: "pengatur_tingkat_i" },
  { label: "Penata", value: "penata" },
  { label: "Penata Tingkat I", value: "penata_tingkat_i" },
  { label: "Pembina", value: "pembina" },
  { label: "Pembina Tingkat I", value: "pembina_tingkat_i" },
  { label: "Pembina Utama Muda", value: "pembina_utama_muda" },
  { label: "Pembina Utama Madya", value: "pembina_utama_madya" },
  { label: "Pembina Utama", value: "pembina_utama" },
];

export const PENILAIAN_OPTIONS: PenilaianOption[] = [
  { label: "Sangat Baik", value: "sangat_baik" },
  { label: "Baik", value: "baik" },
  { label: "Butuh Perbaikan", value: "butuh_perbaikan" },
  { label: "Kurang", value: "kurang" },
  { label: "Sangat Kurang", value: "sangat_kurang" },
];

export const PENILAIAN_TO_PROSENTASE = {
  sangat_baik: 150,
  baik: 100,
  butuh_perbaikan: 75,
  kurang: 50,
  sangat_kurang: 25,
};

export const JENJANG_TO_KOEFISIEN = {
  juru_muda: 1,
  juru_muda_tingkat_i: 1.05,
  juru: 1.1,
  juru_tingkat_i: 1.15,
  pengatur: 1.2,
  pengatur_tingkat_i: 1.25,
  penata: 1.3,
  penata_tingkat_i: 1.35,
  pembina: 1.4,
  pembina_tingkat_i: 1.45,
  pembina_utama_muda: 1.5,
  pembina_utama_madya: 1.55,
  pembina_utama: 1.6,
};

export interface JenjangPendidikanOption {
  label: string;
  value: string;
  nilai: number;
}

export interface JenjangOption {
  label: string;
  value: string;
}

export interface PenilaianOption {
  label: string;
  value: string;
}

export interface PegawaiFormData {
  nama: string;
  nip: string;
  no_seri_karpeg: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  pangkat: string;
  golongan: string;
  tmt_pangkat: string;
  jabatan: string;
  tmt_jabatan: string;
  unit_kerja: string;
}

// Function to calculate AK Pendidikan
export const calculateAkPendidikan = (
  jenjang: string,
  tahunLulus: number,
): number => {
  // This is a sample calculation - adjust according to your business logic
  const baseValues: Record<string, number> = {
    sd: 1,
    smp: 2,
    sma: 3,
    d1: 15,
    d2: 20,
    d3: 25,
    d4s1: 30,
    s2: 50,
    s3: 100,
  };

  const baseValue = baseValues[jenjang] || 0;

  // Calculate bonus based on years since graduation
  const currentYear = new Date().getFullYear();
  const yearsSinceGraduation = Math.max(0, currentYear - tahunLulus);
  const bonus = Math.min(yearsSinceGraduation * 0.5, 20); // Max 20 points bonus

  return baseValue + bonus;
};
