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
  { label: "Keterampilan - Pemula", value: "KETERAMPILAN - PEMULA" },
  { label: "Keterampilan - Terampil", value: "KETERAMPILAN - TERAMPIL" },
  { label: "Keterampilan - Mahir", value: "KETERAMPILAN - MAHIR" },
  { label: "Keterampilan - Penyel ia", value: "KETERAMPILAN - PENYELIA" },
  { label: "Keahlian - Ahli Pertama", value: "KEAHLIAN - AHLI PERTAMA" },
  { label: "Keahlian - Ahli Muda", value: "KEAHLIAN - AHLI MUDA" },
  { label: "Keahlian - Ahli Madya", value: "KEAHLIAN - AHLI MADYA" },
  { label: "Keahlian - Ahli Utama", value: "KEAHLIAN - AHLI UTAMA" },
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

// Helper function to get koefisien from jenjang value (handles both old and new formats)
export const getKoefisienByJenjang = (jenjang: string | undefined): number => {
  if (!jenjang) return 0;

  // Try exact match first
  if (JENJANG_TO_KOEFISIEN[jenjang.trim().toUpperCase()]) {
    return JENJANG_TO_KOEFISIEN[jenjang.trim().toUpperCase()];
  }

  // Map old jenjang values to new ones
  const oldToNewMap: Record<string, string> = {
    pembina: "KEAHLIAN - AHLI PERTAMA",
    pembina_tingkat_i: "KEAHLIAN - AHLI MUDA",
    pembina_utama_muda: "KEAHLIAN - AHLI MADYA",
    pembina_utama_madya: "KEAHLIAN - AHLI UTAMA",
    pembina_utama: "KEAHLIAN - AHLI UTAMA",
    penata: "KETERAMPILAN - MAHIR",
    penata_tingkat_i: "KETERAMPILAN - PENYELIA",
    pengatur: "KETERAMPILAN - TERAMPIL",
    pengatur_tingkat_i: "KETERAMPILAN - MAHIR",
    juru: "KETERAMPILAN - PEMULA",
    juru_tingkat_i: "KETERAMPILAN - TERAMPIL",
  };

  const normalized = jenjang.trim().toLowerCase();
  const newKey = oldToNewMap[normalized];

  if (newKey && JENJANG_TO_KOEFISIEN[newKey]) {
    return JENJANG_TO_KOEFISIEN[newKey];
  }

  return 0;
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
  golongongan: string;
  tmt_pangkat: string;
  jabatan: string;
  tmt_jabatan: string;
  unit_kerja: string;
}

// Base values for jenjang pendidikan (used as fallback when golongongan is not available)
export const JENJANG_PENDIDIKAN_BASE_VALUES: Record<string, number> = {
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
