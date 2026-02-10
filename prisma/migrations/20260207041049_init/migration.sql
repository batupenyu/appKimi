-- CreateTable
CREATE TABLE "Pegawai" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "no_seri_karpeg" TEXT NOT NULL,
    "tempat_lahir" TEXT NOT NULL,
    "tanggal_lahir" TEXT NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,
    "pangkat" TEXT NOT NULL,
    "golonganan" TEXT NOT NULL,
    "tmt_pangkat" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "tmt_jabatan" TEXT NOT NULL,
    "unit_kerja" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AngkaIntegrasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pegawaiId" TEXT NOT NULL,
    "pegawaiNama" TEXT NOT NULL,
    "pegawaiNip" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AngkaIntegrasi_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instansi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PenilaianAngkaKredit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pegawaiId" TEXT NOT NULL,
    "instansiId" TEXT NOT NULL,
    "penilaiId" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "predikat" TEXT NOT NULL,
    "tanggalAwalPenilaian" TEXT NOT NULL,
    "tanggalAkhirPenilaian" TEXT NOT NULL,
    "tanggalDitetapkan" TEXT NOT NULL,
    "tempatDitetapkan" TEXT NOT NULL,
    "prosentase" INTEGER NOT NULL,
    "koefisien" REAL NOT NULL,
    "angkaKredit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PenilaianAngkaKredit_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PenilaianAngkaKredit_instansiId_fkey" FOREIGN KEY ("instansiId") REFERENCES "Instansi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AkPendidikan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pegawaiId" TEXT NOT NULL,
    "nama_pendidikan" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "tahun_lulus" INTEGER NOT NULL,
    "nilai_next_pangkat" REAL NOT NULL,
    "calculated_value" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AkPendidikan_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "Pegawai"("nip");
