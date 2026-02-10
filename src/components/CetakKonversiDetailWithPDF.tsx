import React from 'react';
import KonversiReport from './ui/KonversiReport';
import { KonversiReportPDF } from './ui/KonversiReportPDF';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import type {
  PenilaianAngkaKredit,
  Pegawai,
  Instansi,
} from '@/types';

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

interface CetakKonversiProps {
  penilaian: PenilaianAngkaKredit;
  pegawai: Pegawai;
  instansi?: Instansi;
  penilai?: Pegawai;
  onClose: () => void;
}

interface ReportData {
  nomor: string;
  tahun: string | number;
  namaInstansi: string;
  periodeAwal: string;
  periodeAkhir: string;
  pegawai: {
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
  };
  jabatanDanTmt: string;
  includeAngkaIntegrasi: boolean;
  angkaIntegrasiValue: number;
  includeAkPendidikan: boolean;
  akPendidikanValue: number;
  akList: AKItem[];
  totalAngkaKredit: number;
  tempatDitetapkan: string;
  tanggalDitetapkan: string;
  penilai: Penilai;
}

const generatePDF = async (reportData: ReportData) => {
  try {
    // Create the PDF document using @react-pdf/renderer
    const blob = await pdf(<KonversiReportPDF {...reportData} />).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `konversi-angka-kredit-${reportData.nomor}.pdf`;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
  }
};

export function CetakKonversiDetail({
  penilaian,
  pegawai,
  instansi,
  penilai,
  onClose,
}: CetakKonversiProps) {
  const reportData = {
    nomor: penilaian.id.slice(0, 8).toUpperCase(),
    tahun: new Date(penilaian.tanggalDitetapkan).getFullYear(),
    namaInstansi: instansi?.name || "Instansi",
    periodeAwal: penilaian.tanggalAwalPenilaian,
    periodeAkhir: penilaian.tanggalAkhirPenilaian,
    pegawai: {
      nama: pegawai.nama || "-",
      nip: pegawai.nip || "-",
      noSeriKarpeg: pegawai.no_seri_karpeg || "-",
      tempatLahir: pegawai.tempat_lahir || "-",
      tanggalLahir: pegawai.tanggal_lahir || "-",
      jenisKelamin: pegawai.jenis_kelamin || "-",
      pangkat: pegawai.pangkat || "-",
      golongan: pegawai.golongan || "-",
      tmtPangkat: pegawai.tmt_pangkat || "-",
      unitKerja: pegawai.unit_kerja || "-",
    },
    jabatanDanTmt: `${pegawai.jabatan || "-"} / ${pegawai.tmt_jabatan || "-"}`,
    includeAngkaIntegrasi: false, // This would need to be passed as prop if needed
    angkaIntegrasiValue: 0,
    includeAkPendidikan: false, // This would need to be passed as prop if needed
    akPendidikanValue: 0,
    akList: [
      {
        penilaian: penilaian.predikat,
        prosentase: penilaian.prosentase || 0,
        koefisien: penilaian.koefisien || 0,
        jumlahAngkaKredit: penilaian.angkaKredit,
      },
    ],
    totalAngkaKredit: penilaian.angkaKredit,
    tempatDitetapkan: penilaian.tempatDitetapkan,
    tanggalDitetapkan: penilaian.tanggalDitetapkan,
    penilai: {
      nama: penilai?.nama || "-",
      pangkat: penilai?.pangkat || "-",
      golongan: penilai?.golongan || "-",
      nip: penilai?.nip || "-",
    },
  };

  const handlePrint = () => {
    // Close dialog first, then print
    onClose();
    setTimeout(() => {
      window.print();
    }, 200); // Wait a bit longer to ensure dialog closes before printing
  };

  const handleGeneratePDF = () => {
    generatePDF(reportData);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Preview Konversi Angka Kredit</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF}>
            <Download className="mr-2 h-4 w-4" />
            Unduh PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <KonversiReport
          nomor={reportData.nomor}
          tahun={reportData.tahun}
          namaInstansi={reportData.namaInstansi}
          periodeAwal={reportData.periodeAwal}
          periodeAkhir={reportData.periodeAkhir}
          pegawai={reportData.pegawai}
          jabatanDanTmt={reportData.jabatanDanTmt}
          includeAngkaIntegrasi={reportData.includeAngkaIntegrasi}
          angkaIntegrasiValue={reportData.angkaIntegrasiValue}
          includeAkPendidikan={reportData.includeAkPendidikan}
          akPendidikanValue={reportData.akPendidikanValue}
          akList={reportData.akList}
          totalAngkaKredit={reportData.totalAngkaKredit}
          tempatDitetapkan={reportData.tempatDitetapkan}
          tanggalDitetapkan={reportData.tanggalDitetapkan}
          penilai={reportData.penilai}
        />
      </div>
    </div>
  );
}