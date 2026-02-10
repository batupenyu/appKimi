import React from "react";
import "../KonversiReport.css";

// TypeScript interfaces for type safety
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

interface KonversiReportProps {
  // Document info
  nomor?: string;
  tahun?: string | number;

  // Header info
  namaInstansi: string;
  periodeAwal: string;
  periodeAkhir: string;

  // Personal info (Pegawai)
  pegawai: Pegawai;
  jabatanDanTmt: string;

  // Credit conversion data
  includeAngkaIntegrasi?: boolean;
  angkaIntegrasiValue?: number;
  includeAkPendidikan?: boolean;
  akPendidikanValue?: number;
  akList: AKItem[];
  totalAngkaKredit: number;

  // Footer info
  tempatDitetapkan: string;
  tanggalDitetapkan: string;
  penilai: Penilai;
}

const KonversiReport = React.forwardRef<HTMLDivElement, KonversiReportProps>(
  (props, ref) => {
    const {
      nomor,
      tahun = "TAHUN",
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
    return (
      <div className="konversi-card">
        <div className="konversi-card-body">
          <div id="report-content" className="report-content" ref={ref}>
            {/* Judul & Nomor: CENTER */}
            <div className="header-center">
              <div className="font-bold title">KONVERSI KE ANGKA KREDIT</div>
              <div className="font-bold subtitle">
                NOMOR : 800/ {nomor || "........."} /.........../Dindik/ {tahun}
                /PAK
              </div>
            </div>

            {/* Instansi & Periode */}
            <table className="header-table">
              <tbody>
                <tr>
                  <td>Instansi: {namaInstansi}</td>
                  <td className="text-right">
                    Periode : {periodeAwal} s.d. {periodeAkhir}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tabel Keterangan Perorangan */}
            <table className="personal-table">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>I.</th>
                  <th colSpan={3} style={{ width: "95%", textAlign: "left" }}>
                    KETERANGAN PERORANGAN
                  </th>
                </tr>
              </thead>
              <tbody>
                <PersonalInfoRow
                  number="1."
                  label="Nama"
                  value={pegawai.nama}
                />
                <PersonalInfoRow number="2." label="NIP" value={pegawai.nip} />
                <PersonalInfoRow
                  number="3."
                  label="No. Seri Karpeg"
                  value={pegawai.noSeriKarpeg}
                />
                <PersonalInfoRow
                  number="4."
                  label="Tempat Tgl. Lahir"
                  value={`${pegawai.tempatLahir}, ${pegawai.tanggalLahir}`}
                />
                <PersonalInfoRow
                  number="5."
                  label="Jenis Kelamin"
                  value={pegawai.jenisKelamin}
                />
                <PersonalInfoRow
                  number="6."
                  label="Pangkat/Gol.Ruang/Gol/TMT"
                  value={`${pegawai.pangkat}, ${pegawai.golongan}, ${pegawai.tmtPangkat}`}
                />
                <PersonalInfoRow
                  number="7."
                  label="Jabatan /TMT"
                  value={jabatanDanTmt}
                />
                <PersonalInfoRow
                  number="8."
                  label="Unit Kerja"
                  value={pegawai.unitKerja}
                />
                <PersonalInfoRow
                  number="9."
                  label="Instansi"
                  value={namaInstansi}
                />
              </tbody>
            </table>

            {/* Tabel Angka Kredit */}
            <table className="credit-table">
              <thead>
                <tr>
                  <td colSpan={4}>KONVERSI KE ANGKA KREDIT</td>
                </tr>
                <tr>
                  <td colSpan={2}>HASIL PENILAIAN KINERJA</td>
                  <td rowSpan={2}>
                    KOEFISIEN <br />
                    PER TAHUN
                  </td>
                  <td rowSpan={2}>
                    ANGKA KREDIT <br />
                    YANG DI DAPAT
                  </td>
                </tr>
                <tr>
                  <th>PREDIKAT</th>
                  <th>PROSENTASE</th>
                </tr>
              </thead>
              <tbody>
                {includeAngkaIntegrasi && angkaIntegrasiValue > 0 && (
                  <tr>
                    <td>AK Integrasi</td>
                    <td>.</td>
                    <td>.</td>
                    <td>{angkaIntegrasiValue.toFixed(2)}</td>
                  </tr>
                )}
                {includeAkPendidikan && akPendidikanValue > 0 && (
                  <tr>
                    <td>AK Pendidikan</td>
                    <td>.</td>
                    <td>.</td>
                    <td>{akPendidikanValue.toFixed(2)}</td>
                  </tr>
                )}
                {akList.map((akItem, index) => (
                  <tr key={index}>
                    <td>{akItem.penilaian}</td>
                    <td>{akItem.prosentase}%</td>
                    <td>{akItem.koefisien}</td>
                    <td>{akItem.jumlahAngkaKredit.toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={3}
                    className="text-right font-bold"
                    style={{ paddingRight: "8px" }}
                  >
                    Jumlah Angka Kredit
                  </td>
                  <td className="font-bold">{totalAngkaKredit.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <table className="footer-table">
              <tbody>
                <tr>
                  <td className="footer-left">
                    <p className="footer-text">
                      <strong>ASLI disampaikan dengan hormat kepada:</strong>
                      <br />
                      Jabatan Fungsional yang bersangkutan.
                    </p>
                    <p className="footer-text no-margin">
                      <strong>Tembusan disampaikan kepada:</strong>
                      <br />
                      1. Jabatan Fungsional yang bersangkutan
                      <br />
                      2. Ketua/atasan unit kerja
                      <br />
                      3. Kepala Biro Kepegawaian dan Organisasi
                      <br />
                      4. Pejabat lain yang dianggap perlu.
                    </p>
                  </td>
                  <td className="footer-right">
                    <div className="footer-right-content">
                      <div>Ditetapkan di {tempatDitetapkan}</div>
                      <div>Pada tanggal, {tanggalDitetapkan}.</div>
                      <div className="signature-title">
                        Pejabat Penilai Kinerja
                      </div>
                      <div className="signature-block">
                        {penilai.nama}
                        <br />
                        {penilai.pangkat}, {penilai.golongan}
                        <br />
                        NIP. {penilai.nip}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
);

KonversiReport.displayName = "KonversiReport";

// Sub-component for personal info rows
interface PersonalInfoRowProps {
  number: string;
  label: string;
  value: string;
}

const PersonalInfoRow: React.FC<PersonalInfoRowProps> = ({
  number,
  label,
  value,
}) => (
  <tr>
    <td className="number-cell">{number}</td>
    <td className="label-cell">{label}</td>
    <td className="colon-merged">:</td>
    <td className="value-cell">{value}</td>
  </tr>
);

export default KonversiReport;
