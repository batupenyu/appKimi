import { Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { KonversiReportData } from "./KonversiReportPDF";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.3,
  },
  headerCenter: {
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  nomor: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    fontSize: 10,
  },

  // Table General
  table: {
    width: "100%",
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
  },

  // Personal Table Styles (Same as Akumulasi)
  personalHeader: {
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 3,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  personalCellNumber: {
    width: "5%",
    textAlign: "center",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 3,
  },
  personalCellLabel: {
    width: "30%",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    padding: 3,
  },
  personalCellColon: {
    width: "2%",
    textAlign: "center",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    padding: 3,
  },
  personalCellValue: {
    width: "63%",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 0,
    padding: 3,
  },

  // Credit/Penetapan Table Styles
  borderedTable: {
    width: "100%",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  borderedCell: {
    borderStyle: "solid",
    borderColor: "#000",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    padding: 3,
    textAlign: "center",
    fontSize: 10,
  },
  headerCell: {
    fontFamily: "Helvetica-Bold",
    fontWeight: "bold",
  },
  leftAlign: {
    textAlign: "left",
  },
  rightAlign: {
    textAlign: "right",
  },
  justifyAlign: {
    textAlign: "justify",
  },

  // Footer
  footerTable: {
    flexDirection: "row",
    marginTop: 10,
  },
  footerLeft: {
    width: "60%",
    fontSize: 10,
  },
  footerRight: {
    width: "40%",
    fontSize: 10,
    paddingLeft: 10,
  },
  signatureSpace: {
    marginTop: 40,
    marginBottom: 5,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
    fontWeight: "bold",
  },
});

// Reusable components
const PersonalRow = ({
  no,
  label,
  value,
}: {
  no: string;
  label: string;
  value: string;
}) => (
  <View style={styles.tableRow}>
    <Text style={styles.personalCellNumber}>{no}</Text>
    <Text style={styles.personalCellLabel}>{label}</Text>
    <Text style={styles.personalCellColon}>:</Text>
    <Text style={styles.personalCellValue}>{value}</Text>
  </View>
);

export const PenetapanReportPage = (data: KonversiReportData) => {
  const {
    // nomor, // Unused
    tahun,
    namaInstansi,
    periodeAwal,
    periodeAkhir,
    pegawai,
    jabatanDanTmt,
    includeAngkaIntegrasi,
    angkaIntegrasiValue,
    includeAkPendidikan,
    akPendidikanValue,
    akList = [],
    totalAngkaKredit,
    tempatDitetapkan,
    tanggalDitetapkan,
    penilai,
    pangkatMinimal = 0,
    jenjangMinimal = null as number | null,
    hasilPangkat = 0,
    hasilJenjang = 0,
    teksTujuan = "Jabatan ...........",
  } = data;

  // Placeholder calculations (mimicking the HTML logic)
  const totalLama = 0;
  const akPendidikan = akPendidikanValue || 0;
  const akIntegrasi = includeAngkaIntegrasi ? angkaIntegrasiValue || 0 : 0;
  const totalPerformanceOnly = totalAngkaKredit - akPendidikan - akIntegrasi;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatJabatanTmt = (jabatanDanTmt: string) => {
    if (!jabatanDanTmt) return "-";
    // Split by " / " to separate jabatan and tmt date
    const parts = jabatanDanTmt.split(" / ");
    if (parts.length === 2) {
      return `${parts[0]} / ${formatDateDDMMYYYY(parts[1])}`;
    }
    return jabatanDanTmt;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  const getPeriodeYear = () => {
    if (!periodeAkhir) return new Date().getFullYear();
    return new Date(periodeAkhir).getFullYear();
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerCenter}>
        <Text style={styles.title}>PENETAPAN ANGKA KREDIT</Text>
        <Text style={styles.nomor}>
          NOMOR : 800/ ......... /.........../Dindik/{getPeriodeYear()}/PAK
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text>Instansi: {namaInstansi}</Text>
        <Text>
          Periode : {formatDate(periodeAwal)} s.d. {formatDate(periodeAkhir)}
        </Text>
      </View>

      {/* Personal Info Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{ ...styles.personalHeader, width: "5%" }}>
            <Text>I.</Text>
          </View>
          <View
            style={{
              ...styles.personalHeader,
              width: "95%",
              borderLeftWidth: 0,
            }}
          >
            <Text>KETERANGAN PERORANGAN</Text>
          </View>
        </View>

        <PersonalRow no="1." label="Nama" value={pegawai.nama} />
        <PersonalRow no="2." label="NIP" value={pegawai.nip} />
        <PersonalRow
          no="3."
          label="No. Seri Karpeg"
          value={pegawai.noSeriKarpeg}
        />
        <PersonalRow
          no="4."
          label="Tempat Tgl. Lahir"
          value={`${pegawai.tempatLahir}, ${formatDate(pegawai.tanggalLahir)}`}
        />
        <PersonalRow
          no="5."
          label="Jenis Kelamin"
          value={pegawai.jenisKelamin}
        />
        <PersonalRow
          no="6."
          label="Pangkat/Gol.Ruang/TMT"
          value={`${pegawai.pangkat}, ${pegawai.golongan}, ${formatDate(pegawai.tmtPangkat)}`}
        />
        <PersonalRow
          no="7."
          label="Jabatan /TMT"
          value={formatJabatanTmt(jabatanDanTmt)}
        />
        <PersonalRow no="8." label="Unit Kerja" value={pegawai.unitKerja} />
        <PersonalRow no="9." label="Instansi" value={namaInstansi} />
      </View>

      {/* Penetapan Table */}
      <View style={styles.borderedTable}>
        {/* Header */}
        <View style={styles.tableRow}>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.headerCell,
              width: "5%",
            }}
          >
            II.
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.headerCell,
              width: "45%",
              textAlign: "left",
            }}
          >
            PENETAPAN ANGKA KREDIT
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.headerCell,
              width: "10%",
            }}
          >
            LAMA
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.headerCell,
              width: "10%",
            }}
          >
            BARU
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.headerCell,
              width: "10%",
            }}
          >
            JUMLAH
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.headerCell,
              width: "20%",
            }}
          >
            KETERANGAN
          </Text>
        </View>

        {/* Row 1: Dasar */}
        <View style={styles.tableRow}>
          <Text style={{ ...styles.borderedCell, width: "5%" }}>1.</Text>
          <Text
            style={{ ...styles.borderedCell, width: "45%", textAlign: "left" }}
          >
            AK dasar yang diberikan
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            -
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            -
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            -
          </Text>
          <Text style={{ ...styles.borderedCell, width: "20%" }}>-</Text>
        </View>

        {/* Row 2: Predikat (Performance) */}
        <View style={styles.tableRow}>
          <Text style={{ ...styles.borderedCell, width: "5%" }}>2.</Text>
          <Text
            style={{ ...styles.borderedCell, width: "45%", textAlign: "left" }}
          >
            AK konversi dari predikat
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            {formatNumber(totalLama)}
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            {formatNumber(totalPerformanceOnly)}
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            {formatNumber(totalPerformanceOnly)}
          </Text>
          <Text style={{ ...styles.borderedCell, width: "20%" }}>-</Text>
        </View>

        {/* Row 3: Penyesuaian */}
        <View style={styles.tableRow}>
          <Text style={{ ...styles.borderedCell, width: "5%" }}>3.</Text>
          <Text
            style={{ ...styles.borderedCell, width: "45%", textAlign: "left" }}
          >
            AK penyesuaian penyetaraan
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            -
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            -
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            -
          </Text>
          <Text style={{ ...styles.borderedCell, width: "20%" }}>-</Text>
        </View>

        {/* Row 4: Pendidikan */}
        <View style={styles.tableRow}>
          <Text style={{ ...styles.borderedCell, width: "5%" }}>4.</Text>
          <Text
            style={{ ...styles.borderedCell, width: "45%", textAlign: "left" }}
          >
            AK yang diperoleh dari peningkatan pendidikan
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            -
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            {formatNumber(akPendidikan)}
          </Text>
          <Text
            style={{ ...styles.borderedCell, width: "10%", textAlign: "right" }}
          >
            {formatNumber(akPendidikan)}
          </Text>
          <Text style={{ ...styles.borderedCell, width: "20%" }}>-</Text>
        </View>

        {/* Row 5: Total */}
        <View style={styles.tableRow}>
          <Text style={{ ...styles.borderedCell, ...styles.bold, width: "5%" }}>
            5.
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.bold,
              width: "45%",
              textAlign: "left",
            }}
          >
            JUMLAH
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.bold,
              width: "10%",
              textAlign: "right",
            }}
          >
            {formatNumber(totalLama)}
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.bold,
              width: "10%",
              textAlign: "right",
            }}
          >
            {formatNumber(totalAngkaKredit)}
          </Text>
          <Text
            style={{
              ...styles.borderedCell,
              ...styles.bold,
              width: "10%",
              textAlign: "right",
            }}
          >
            {formatNumber(totalAngkaKredit)}
          </Text>
          <Text style={{ ...styles.borderedCell, width: "20%" }}>-</Text>
        </View>
      </View>

      {/* Conclusion */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ marginBottom: 5 }}>
          Berdasarkan Penetapan Angka Kredit tersebut, maka:
        </Text>
        <Text style={{ marginBottom: 5 }}>
          Angka Kredit Minimal yang diperlukan untuk naik jenjang/jabatan
          setingkat lebih tinggi:
        </Text>
        <Text style={{ marginBottom: 5, marginLeft: 20 }}>
          <Text style={styles.bold}>Pangkat/Jabatan Tujuan: </Text>
          {teksTujuan}
        </Text>
        <Text style={{ marginBottom: 5, marginLeft: 20 }}>
          <Text style={styles.bold}>Angka Kredit Minimal: </Text>
          {formatNumber(pangkatMinimal)} / {formatNumber(jenjangMinimal)}
        </Text>
        <Text style={{ marginBottom: 5, marginLeft: 20 }}>
          <Text style={styles.bold}>Angka Kredit yang dicapai: </Text>
          {formatNumber(totalAngkaKredit)}
        </Text>
        <Text style={{ marginBottom: 5, marginLeft: 20 }}>
          <Text style={styles.bold}>
            Sisa Angka Kredit yang harus dicapai:{" "}
          </Text>
          {formatNumber(pangkatMinimal - totalAngkaKredit)} /{" "}
          {formatNumber((jenjangMinimal || 0) - totalAngkaKredit)}
        </Text>
        <Text
          style={{
            marginTop: 10,
            borderStyle: "solid",
            borderColor: "#000",
            borderWidth: 1,
            padding: 5,
          }}
        >
          <Text style={styles.bold}>
            {hasilPangkat >= 0 ? "Dapat" : "Tidak dapat"}
          </Text>{" "}
          dipertimbangkan untuk kenaikan Pangkat/Jabatan setingkat lebih tinggi
          ke <Text style={styles.bold}>{teksTujuan}</Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footerTable}>
        <View style={styles.footerLeft}>
          <Text style={{ marginBottom: 8 }}>
            <Text style={styles.bold}>
              ASLI disampaikan dengan hormat kepada:
            </Text>
            {"\n"}
            Jabatan Fungsional yang bersangkutan.
          </Text>
          <Text>
            <Text style={styles.bold}>Tembusan disampaikan kepada:</Text>
            {"\n"}
            1. Jabatan Fungsional yang bersangkutan{"\n"}
            2. Ketua/atasan unit kerja{"\n"}
            3. Kepala Biro Kepegawaian dan Organisasi{"\n"}
            4. Pejabat lain yang dianggap perlu.
          </Text>
        </View>

        <View style={styles.footerRight}>
          <Text>Ditetapkan di {tempatDitetapkan}</Text>
          <Text>Pada tanggal, {formatDate(tanggalDitetapkan)}</Text>

          <Text style={{ marginTop: 10 }}>Pejabat Penilai Kinerja</Text>

          <View style={styles.signatureSpace} />

          <Text style={styles.bold}>{penilai.nama}</Text>
          <Text>
            {penilai.pangkat}, {penilai.golongan}
          </Text>
          <Text>NIP. {penilai.nip}</Text>
        </View>
      </View>
    </Page>
  );
};
