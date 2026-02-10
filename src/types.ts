// src/types.ts

export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  no_seri_karpeg: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string; // "Laki-laki" | "Perempuan"
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

export interface PenilaianAngkaKredit {
  id: string;
  pegawaiId: string;
  instansiId: string;
  penilaiId: string;
  jenjang: string;
  predikat: string;
  tanggalAwalPenilaian: string;
  tanggalAkhirPenilaian: string;
  tanggalDitetapkan: string;
  tempatDitetapkan: string;
  prosentase: number;
  koefisien: number;
  angkaKredit: number;
  createdAt: string;
  updatedAt: string;
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

// Additional types needed by the application
export type ViewState =
  | "dashboard"
  | "pegawai"
  | "angka-integrasi"
  | "ak-pendidikan"
  | "penilaian-angka-kredit"
  | "cetak-akumulasi"
  | "cetak-penetapan"
  | "instansi";

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
