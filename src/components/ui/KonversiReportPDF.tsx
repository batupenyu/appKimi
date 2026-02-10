import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// TypeScript interfaces
interface Pegawai {
  nama: string;
  nip: string;
  noSeriKarpeg: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  pangkat: string;
  golongan: string;
  tmtPangkat: string;
  unitKerja: string;
}

interface AKItem {
  penilaian: string;
  prosentase: number;
  koefisien: number;
  jumlahAngkaKredit: number;
}

interface Penilai {
  nama: string;
  pangkat: string;
  golongan: string;
  nip: string;
}

export interface KonversiReportPDFProps {
  nomor?: string;
  tahun?: string | number;
  namaInstansi: string;
  periodeAwal: string;
  periodeAkhir: string;
  pegawai: Pegawai;
  jabatanDanTmt: string;
  includeAngkaIntegrasi?: boolean;
  angkaIntegrasiValue?: number;
  includeAkPendidikan?: boolean;
  akPendidikanValue?: number;
  akList: AKItem[];
  totalAngkaKredit: number;
  tempatDitetapkan: string;
  tanggalDitetapkan: string;
  penilai: Penilai;
  // Optional calculated fields for Penetapan Report
  pangkatMinimal?: number;
  jenjangMinimal?: number | null;
  hasilPangkat?: number;
  hasilJenjang?: number;
  teksTujuan?: string;
}

export type KonversiReportData = KonversiReportPDFProps;

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  table: {
    width: "100%",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#000",
    fontWeight: "bold",
    padding: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#000",
  },
  tableCell: {
    padding: 4,
    fontSize: 10,
  },
  tableCellBold: {
    padding: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    marginTop: 15,
  },
  footerLeft: {
    width: "60%",
    fontSize: 10,
  },
  footerRight: {
    width: "40%",
    fontSize: 10,
  },
});

// Reusable Page Component
export const KonversiReportPage: React.FC<KonversiReportPDFProps> = (props) => {
  const {
    nomor = ".........",
    tahun,
    namaInstansi,
    periodeAwal,
    periodeAkhir,
    pegawai,
    jabatanDanTmt,
    includeAngkaIntegrasi = false,
    angkaIntegrasiValue = 0,
    includeAkPendidikan = false,
    akPendidikanValue = 0,
    akList,
    totalAngkaKredit,
    tempatDitetapkan,
    tanggalDitetapkan,
    penilai,
  } = props;

  const getPeriodeYear = () => {
    if (!periodeAkhir) return tahun || "TAHUN";
    return new Date(periodeAkhir).getFullYear();
  };

  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
  <Page size="A4" style={styles.page}>
    {/* Title */}
    <Text style={styles.title}>KONVERSI KE ANGKA KREDIT</Text>
    <Text style={styles.subtitle}>
      NOMOR : 800/ {nomor} /.........../Dindik/ {getPeriodeYear()}/PAK
    </Text>

    {/* Header Info */}
    <View style={styles.headerRow}>
      <Text>Instansi: {namaInstansi}</Text>
      <Text>
        Periode : {formatDateDDMMYYYY(periodeAwal)} s.d. {formatDateDDMMYYYY(periodeAkhir)}
      </Text>
    </View>

    {/* Personal Information Table */}
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text
          style={[styles.tableCellBold, { width: "5%", textAlign: "center" }]}
        >
          I.
        </Text>
        <Text style={[styles.tableCellBold, { width: "95%" }]}>
          KETERANGAN PERORANGAN
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          1.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>Nama</Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>{pegawai.nama}</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          2.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>NIP</Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>{pegawai.nip}</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          3.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>
          No. Seri Karpeg
        </Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>
          {pegawai.noSeriKarpeg}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          4.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>
          Tempat Tgl. Lahir
        </Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>
          {pegawai.tempatLahir}, {pegawai.tanggalLahir}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          5.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>Jenis Kelamin</Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>
          {pegawai.jenisKelamin}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          6.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>
          Pangkat/Gol.Ruang/Gol/TMT
        </Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>
          {pegawai.pangkat}, {pegawai.golongan}, {pegawai.tmtPangkat}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          7.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>Jabatan /TMT</Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>
          {jabatanDanTmt}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          8.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>Unit Kerja</Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>
          {pegawai.unitKerja}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: "5%", textAlign: "center" }]}>
          9.
        </Text>
        <Text style={[styles.tableCell, { width: "30%" }]}>Instansi</Text>
        <Text style={[styles.tableCell, { width: "2%", textAlign: "center" }]}>
          :
        </Text>
        <Text style={[styles.tableCell, { width: "63%" }]}>{namaInstansi}</Text>
      </View>
    </View>

    {/* Credit Table */}
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text
          style={[styles.tableCellBold, { width: "100%", textAlign: "center" }]}
        >
          KONVERSI KE ANGKA KREDIT
        </Text>
      </View>

      <View style={[styles.tableRow, { borderTopWidth: 1 }]}>
        <Text
          style={[styles.tableCellBold, { width: "35%", textAlign: "center" }]}
        >
          PREDIKAT
        </Text>
        <Text
          style={[styles.tableCellBold, { width: "20%", textAlign: "center" }]}
        >
          PROSENTASE
        </Text>
        <Text
          style={[styles.tableCellBold, { width: "20%", textAlign: "center" }]}
        >
          KOEFISIEN PER TAHUN
        </Text>
        <Text
          style={[styles.tableCellBold, { width: "25%", textAlign: "center" }]}
        >
          ANGKA KREDIT YANG DI DAPAT
        </Text>
      </View>

      {includeAngkaIntegrasi && angkaIntegrasiValue > 0 && (
        <View style={styles.tableRow}>
          <Text
            style={[styles.tableCell, { width: "35%", textAlign: "center" }]}
          >
            AK Integrasi
          </Text>
          <Text
            style={[styles.tableCell, { width: "20%", textAlign: "center" }]}
          >
            .
          </Text>
          <Text
            style={[styles.tableCell, { width: "20%", textAlign: "center" }]}
          >
            .
          </Text>
          <Text
            style={[styles.tableCell, { width: "25%", textAlign: "center" }]}
          >
            {angkaIntegrasiValue.toFixed(2)}
          </Text>
        </View>
      )}

      {includeAkPendidikan && akPendidikanValue > 0 && (
        <View style={styles.tableRow}>
          <Text
            style={[styles.tableCell, { width: "35%", textAlign: "center" }]}
          >
            AK Pendidikan
          </Text>
          <Text
            style={[styles.tableCell, { width: "20%", textAlign: "center" }]}
          >
            .
          </Text>
          <Text
            style={[styles.tableCell, { width: "20%", textAlign: "center" }]}
          >
            .
          </Text>
          <Text
            style={[styles.tableCell, { width: "25%", textAlign: "center" }]}
          >
            {akPendidikanValue.toFixed(2)}
          </Text>
        </View>
      )}

      {akList.map((akItem, index) => (
        <View key={index} style={styles.tableRow}>
          <Text
            style={[styles.tableCell, { width: "35%", textAlign: "center" }]}
          >
            {akItem.penilaian}
          </Text>
          <Text
            style={[styles.tableCell, { width: "20%", textAlign: "center" }]}
          >
            {akItem.prosentase}%
          </Text>
          <Text
            style={[styles.tableCell, { width: "20%", textAlign: "center" }]}
          >
            {akItem.koefisien}
          </Text>
          <Text
            style={[styles.tableCell, { width: "25%", textAlign: "center" }]}
          >
            {akItem.jumlahAngkaKredit.toFixed(2)}
          </Text>
        </View>
      ))}

      <View style={styles.tableRow}>
        <Text
          style={[
            styles.tableCellBold,
            { width: "75%", textAlign: "right", paddingRight: 8 },
          ]}
        >
          Jumlah Angka Kredit
        </Text>
        <Text
          style={[styles.tableCellBold, { width: "25%", textAlign: "center" }]}
        >
          {totalAngkaKredit.toFixed(2)}
        </Text>
      </View>
    </View>

    {/* Footer */}
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
          ASLI disampaikan dengan hormat kepada:
        </Text>
        <Text style={{ marginBottom: 10 }}>
          Jabatan Fungsional yang bersangkutan.
        </Text>

        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
          Tembusan disampaikan kepada:
        </Text>
        <Text>1. Jabatan Fungsional yang bersangkutan</Text>
        <Text>2. Ketua/atasan unit kerja</Text>
        <Text>3. Kepala Biro Kepegawaian dan Organisasi</Text>
        <Text>4. Pejabat lain yang dianggap perlu.</Text>
      </View>

      <View style={styles.footerRight}>
        <Text>Ditetapkan di {tempatDitetapkan}</Text>
        <Text>Pada tanggal, {tanggalDitetapkan}.</Text>
        <Text style={{ marginTop: 10 }}>Pejabat Penilai Kinerja</Text>
        <Text style={{ marginTop: 30 }}>{penilai.nama}</Text>
        <Text>
          {penilai.pangkat}, {penilai.golongan}
        </Text>
        <Text>NIP. {penilai.nip}</Text>
      </View>
    </View>
  </Page>
);

// PDF Document Component
export const KonversiReportPDF: React.FC<KonversiReportPDFProps> = (props) => (
  <Document>
    <KonversiReportPage {...props} />
  </Document>
);
