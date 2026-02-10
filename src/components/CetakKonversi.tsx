import React, { useState, useMemo } from "react";
import KonversiReport from "./ui/KonversiReport";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Printer, Download } from "lucide-react";
import {
  usePenilaianAngkaKreditStorage,
  usePegawaiStorage,
  useAngkaIntegrasiStorage,
  useAkPendidikanStorage,
  useInstansiStorage,
} from "@/hooks/useStorage";
import { PENILAIAN_TO_PROSENTASE, JENJANG_TO_KOEFISIEN } from "@/constants";

export function CetakKonversi() {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPenilaianId, setSelectedPenilaianId] = useState<string>("");

  const { penilaianAK } = usePenilaianAngkaKreditStorage();
  const { pegawai } = usePegawaiStorage();
  const { angkaIntegrasi } = useAngkaIntegrasiStorage();
  const { akPendidikan, getTotalAkPendidikanByPegawai } =
    useAkPendidikanStorage();
  const { instansi } = useInstansiStorage();

  // Pegawai lookup map
  const pegawaiMap = useMemo(() => {
    const map = new Map();
    pegawai.forEach((p) => map.set(p.id, p));
    return map;
  }, [pegawai]);

  // Selected penilaian data
  const selectedPenilaian = useMemo(() => {
    return penilaianAK.find((p) => p.id === selectedPenilaianId);
  }, [penilaianAK, selectedPenilaianId]);

  // Build report data from storage
  const reportData = useMemo(() => {
    if (!selectedPenilaian) return null;

    const selectedPegawai = pegawaiMap.get(selectedPenilaian.pegawaiId);
    const selectedInstansi = instansi.find(
      (i) => i.id === selectedPenilaian.instansiId,
    );
    const penilai = pegawaiMap.get(selectedPenilaian.penilaiId);
    const penilaiAngkaIntegrasi = angkaIntegrasi.filter(
      (ai) => ai.pegawaiId === selectedPenilaian.pegawaiId,
    );
    const penilaiAkPendidikan = akPendidikan.filter(
      (ap) => ap.pegawaiId === selectedPenilaian.pegawaiId,
    );

    // Calculate values
    const prosentase = PENILAIAN_TO_PROSENTASE[selectedPenilaian.predikat] || 0;
    const koefisien =
      (JENJANG_TO_KOEFISIEN as any)[selectedPenilaian.jenjang] || 0;
    const totalAkIntegrasi = penilaiAngkaIntegrasi.reduce(
      (sum, ai) => sum + ai.value,
      0,
    );
    const totalAkPendidikan = getTotalAkPendidikanByPegawai(
      selectedPenilaian.pegawaiId,
    );

    // Build AK list
    const akList = [
      {
        penilaian: selectedPenilaian.predikat,
        prosentase: prosentase,
        koefisien: koefisien,
        jumlahAngkaKredit: selectedPenilaian.angkaKredit,
      },
    ];

    // Calculate total AK
    const totalAngkaKredit =
      totalAkIntegrasi + totalAkPendidikan + selectedPenilaian.angkaKredit;

    return {
      nomor: selectedPenilaian.id.slice(0, 8).toUpperCase(),
      tahun: new Date(selectedPenilaian.tanggalDitetapkan).getFullYear(),
      namaInstansi: selectedInstansi?.name || "Instansi",
      periodeAwal: selectedPenilaian.tanggalAwalPenilaian,
      periodeAkhir: selectedPenilaian.tanggalAkhirPenilaian,
      pegawai: {
        nama: selectedPegawai?.nama || "-",
        nip: selectedPegawai?.nip || "-",
        noSeriKarpeg: selectedPegawai?.no_seri_karpeg || "-",
        tempatLahir: selectedPegawai?.tempat_lahir || "-",
        tanggalLahir: selectedPegawai?.tanggal_lahir || "-",
        jenisKelamin: selectedPegawai?.jenis_kelamin || "-",
        pangkat: selectedPegawai?.pangkat || "-",
        golongan: selectedPegawai?.golongan || "-",
        tmtPangkat: selectedPegawai?.tmt_pangkat || "-",
        unitKerja: selectedPegawai?.unit_kerja || "-",
      },
      jabatanDanTmt: `${selectedPegawai?.jabatan || "-"} / ${selectedPegawai?.tmt_jabatan || "-"}`,
      includeAngkaIntegrasi: totalAkIntegrasi > 0,
      angkaIntegrasiValue: totalAkIntegrasi,
      includeAkPendidikan: totalAkPendidikan > 0,
      akPendidikanValue: totalAkPendidikan,
      akList: akList,
      totalAngkaKredit: totalAngkaKredit,
      tempatDitetapkan: selectedPenilaian.tempatDitetapkan,
      tanggalDitetapkan: selectedPenilaian.tanggalDitetapkan,
      penilai: {
        nama: penilai?.nama || "-",
        pangkat: penilai?.pangkat || "-",
        golongan: penilai?.golongan || "-",
        nip: penilai?.nip || "-",
      },
    };
  }, [
    selectedPenilaian,
    pegawaiMap,
    instansi,
    angkaIntegrasi,
    akPendidikan,
    getTotalAkPendidikanByPegawai,
  ]);

  const handlePrint = () => {
    // Close dialog first, then print
    setShowPreview(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Function to generate PDF using the utility
  const handleGeneratePDF = () => {
    if (!reportData) return;
    
    // Show loading indicator
    const originalText = document.activeElement?.textContent || 'Unduh PDF';
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.disabled = true;
      document.activeElement.textContent = 'Mengunduh...';
    }
    
    import('@/utils/pdfGenerator').then(({ generatePDFWithPuppeteer }) => {
      generatePDFWithPuppeteer(reportData)
        .then(() => {
          // Restore button text after successful PDF generation
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.disabled = false;
            document.activeElement.textContent = originalText;
          }
        })
        .catch(err => {
          console.error('Error generating PDF:', err);
          alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
          // Restore button text after error
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.disabled = false;
            document.activeElement.textContent = originalText;
          }
        });
    }).catch(err => {
      console.error('Error importing PDF generator:', err);
      alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
      // Restore button text after error
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.disabled = false;
        document.activeElement.textContent = originalText;
      }
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Selection */}
      <div className="space-y-2">
        <Label>Pilih Penilaian Angka Kredit</Label>
        <Select
          value={selectedPenilaianId}
          onValueChange={setSelectedPenilaianId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih penilaian..." />
          </SelectTrigger>
          <SelectContent>
            {penilaianAK.map((item) => {
              const p = pegawaiMap.get(item.pegawaiId);
              return (
                <SelectItem key={item.id} value={item.id}>
                  {p?.nama || "Unknown"} - {item.jenjang} ({item.predikat})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => setShowPreview(true)}
        disabled={!selectedPenilaianId || !reportData}
      >
        <FileText className="mr-2 h-4 w-4" />
        Preview & Cetak
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Konversi Angka Kredit</DialogTitle>
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
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Tutup
            </Button>
            <Button variant="outline" onClick={() => handleGeneratePDF()} disabled={!reportData}>
              <Download className="mr-2 h-4 w-4" />
              Unduh PDF
            </Button>
            <Button onClick={handlePrint} disabled={!reportData}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
