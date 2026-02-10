import { Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { KonversiReportData } from "./KonversiReportPDF";

// Register standard fonts
Font.register({
  family: "Arial",
  src: "https://fonts.gstatic.com/s/arial/v12/AKp_yCoSgHpPl8a6jA.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica", // Using Helvetica as standard PDF font which is close to Arial
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
  // Table Styles
  table: {
    width: "100%",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
  },
  // Personal Table specific styles mimicking the HTML
  personalHeader: {
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2,
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
    borderLeftWidth: 0,
    borderRightWidth: 0,
    padding: 3,
  },
  personalCellColon: {
    width: "2%", // approx 30px
    textAlign: "center",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
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

  // Credit Table Styles
  creditTable: {
    width: "100%",
    borderStyle: "solid",
    borderColor: "#000",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  creditCell: {
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
  creditHeader: {
    fontFamily: "Helvetica-Bold",
    fontWeight: "bold",
    backgroundColor: "#fff",
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
  textRight: {
    textAlign: "right",
  },
  textCenter: {
    textAlign: "center",
  },
});

// Reusable parts
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

export const AkumulasiReportPage = (data: KonversiReportData) => {
  const {
    nomor,
    tahun,
    namaInstansi,
    periodeAwal,
    periodeAkhir,
    pegawai,
    jabatanDanTmt,
    includeAngkaIntegrasi,
    angkaIntegrasiValue = 0,
    includeAkPendidikan,
    akPendidikanValue = 0,
    akList,
    totalAngkaKredit,
    tempatDitetapkan,
    tanggalDitetapkan,
    penilai,
  } = data;

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

  const getPeriodeYear = () => {
    if (!periodeAkhir) return tahun || "TAHUN";
    return new Date(periodeAkhir).getFullYear();
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerCenter}>
        <Text style={styles.title}>AKUMULASI ANGKA KREDIT</Text>
        <Text style={styles.nomor}>
          NOMOR : 800/ {nomor || "..........."} /.........../Dindik/{" "}
          {getPeriodeYear()}/PAK
        </Text>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text>Instansi: {namaInstansi}</Text>
        <Text>
          Periode : {formatDateDDMMYYYY(periodeAwal)} s.d.{" "}
          {formatDateDDMMYYYY(periodeAkhir)}
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
        <PersonalRow no="7." label="Jabatan /TMT" value={jabatanDanTmt} />
        <PersonalRow no="8." label="Unit Kerja" value={pegawai.unitKerja} />
        <PersonalRow no="9." label="Instansi" value={namaInstansi} />
      </View>

      {/* Credit Table */}
      <View style={styles.creditTable}>
        {/* Header Rows */}
        <View style={styles.tableRow}>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "100%",
              borderBottomWidth: 1,
            }}
          >
            KONVERSI KE ANGKA KREDIT
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "60%",
            }}
          >
            HASIL PENILAIAN KINERJA
          </Text>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "20%",
            }}
          >
            KOEFISIEN{"\n"}PER TAHUN
          </Text>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "20%",
            }}
          >
            ANGKA KREDIT{"\n"}YANG DI DAPAT
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "40%",
            }}
          >
            PREDIKAT
          </Text>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "20%",
            }}
          >
            PROSENTASE
          </Text>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "20%",
              borderTopWidth: 0,
            }}
          ></Text>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.creditHeader,
              width: "20%",
              borderTopWidth: 0,
            }}
          ></Text>
        </View>

        {/* Data Rows */}
        {includeAngkaIntegrasi && angkaIntegrasiValue > 0 && (
          <View style={styles.tableRow}>
            <Text
              style={{ ...styles.creditCell, width: "40%", textAlign: "left" }}
            >
              AK Integrasi
            </Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>.</Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>.</Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>
              {(angkaIntegrasiValue || 0).toFixed(2)}
            </Text>
          </View>
        )}

        {includeAkPendidikan && akPendidikanValue > 0 && (
          <View style={styles.tableRow}>
            <Text
              style={{ ...styles.creditCell, width: "40%", textAlign: "left" }}
            >
              AK Pendidikan
            </Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>.</Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>.</Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>
              {(akPendidikanValue || 0).toFixed(2)}
            </Text>
          </View>
        )}

        {akList.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text
              style={{ ...styles.creditCell, width: "40%", textAlign: "left" }}
            >
              {item.penilaian}
            </Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>
              {item.prosentase}%
            </Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>
              {item.koefisien}
            </Text>
            <Text style={{ ...styles.creditCell, width: "20%" }}>
              {item.jumlahAngkaKredit.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Total Row */}
        <View style={styles.tableRow}>
          <Text
            style={{
              ...styles.creditCell,
              ...styles.bold,
              width: "80%",
              textAlign: "right",
              paddingRight: 8,
            }}
          >
            Jumlah Angka Kredit
          </Text>
          <Text style={{ ...styles.creditCell, ...styles.bold, width: "20%" }}>
            {totalAngkaKredit.toFixed(2)}
          </Text>
        </View>
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
