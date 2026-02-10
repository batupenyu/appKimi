import React, { useState } from "react";
import KonversiReport from "./ui/KonversiReport";
import { KonversiReportPDF } from "./ui/KonversiReportPDF";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, Download, FileText } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import type { PenilaianAngkaKredit, Pegawai, Instansi } from "@/types";

interface CetakKonversiProps {
  penilaian: PenilaianAngkaKredit;
  pegawai: Pegawai;
  instansi?: Instansi;
  penilai?: Pegawai;
  onClose?: () => void;
}

export function CetakKonversiDetail({
  penilaian,
  pegawai,
  instansi,
  penilai,
}: Omit<CetakKonversiProps, 'onClose'>) {
  const [showPreview, setShowPreview] = useState(false);

  const handleClose = () => {
    setShowPreview(false);
  };

  const handlePrint = () => {
    // Close dialog first, then print
    handleClose();
    setTimeout(() => {
      window.print();
    }, 200); // Wait a bit longer to ensure dialog closes before printing
  };

  // Build report data from props
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

  const handleGeneratePDF = async () => {
    let buttonElement: HTMLButtonElement | null = null;
    const originalText = 'Unduh PDF';

    try {
      // Show loading indicator
      if (document.activeElement instanceof HTMLButtonElement) {
        buttonElement = document.activeElement;
        buttonElement.disabled = true;
        buttonElement.textContent = 'Mengunduh...';
      }

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

      // Restore button text
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
      
      // Restore button text after error
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
      }
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPreview(true)}
        title="Preview & Cetak"
      >
        <FileText className="h-4 w-4" />
      </Button>

      <Dialog
        open={showPreview}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Konversi Angka Kredit</DialogTitle>
            <DialogDescription className="hidden">
              Halaman pratinjau dokumen konversi angka kredit sebelum dicetak atau diunduh.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {reportData && (
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
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleClose}>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
