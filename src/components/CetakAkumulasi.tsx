import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { pdf, Document } from "@react-pdf/renderer";
import { AkumulasiReportPage } from "./ui/AkumulasiReportPDF";
import {
  usePenilaianAngkaKreditStorage,
  useAngkaIntegrasiStorage,
  useAkPendidikanStorage,
  usePegawaiStorage,
  useInstansiStorage,
} from "@/hooks/useStorage";

export function CetakAkumulasi() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Fetch data from storage
  const { penilaianAK } = usePenilaianAngkaKreditStorage();
  const { pegawai } = usePegawaiStorage();
  const { instansi } = useInstansiStorage();
  const { angkaIntegrasi } = useAngkaIntegrasiStorage();
  const { getTotalAkPendidikanByPegawai } = useAkPendidikanStorage();

  // Configuration state
  const [includeAkIntegrasi, setIncludeAkIntegrasi] = useState(false);
  const [includeAkPendidikan, setIncludeAkPendidikan] = useState(false);
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>("");

  // Get unique employees from penilaianAK
  const employeesWithAssessments = useMemo(() => {
    const uniqueIds = new Set(penilaianAK.map((p) => p.pegawaiId));
    return pegawai.filter((p) => uniqueIds.has(p.id));
  }, [penilaianAK, pegawai]);

  // Get all periods for selected employee
  const employeePeriods = useMemo(() => {
    if (!selectedPegawaiId) return [];
    return penilaianAK
      .filter((p) => p.pegawaiId === selectedPegawaiId)
      .sort(
        (a, b) =>
          new Date(b.tanggalAkhirPenilaian).getTime() -
          new Date(a.tanggalAkhirPenilaian).getTime(),
      );
  }, [penilaianAK, selectedPegawaiId]);

  const handleOpenDialog = () => {
    if (penilaianAK.length === 0) {
      alert("Tidak ada data untuk dicetak");
      return;
    }
    setShowDialog(true);
  };

  const handleGeneratePDF = async () => {
    if (!selectedPegawaiId) {
      alert("Silakan pilih 1 pegawai");
      return;
    }

    setShowDialog(false);
    setIsGenerating(true);

    try {
      const selectedEmployee = pegawai.find((p) => p.id === selectedPegawaiId);
      // Get instansi from the first penilaian
      const firstPenilaian = penilaianAK.find(
        (p) => p.pegawaiId === selectedPegawaiId,
      );
      const employeeInstansi = firstPenilaian
        ? instansi.find((i) => i.id === firstPenilaian.instansiId)
        : null;
      const penilai = firstPenilaian
        ? pegawai.find((p) => p.id === firstPenilaian.penilaiId)
        : null;

      // Get all penilaian for this employee
      const employeePenilaian = employeePeriods;

      // Build akList with all periods
      const akList = employeePenilaian.map((penilaian) => ({
        penilaian: penilaian.predikat,
        prosentase: penilaian.prosentase || 0,
        koefisien: penilaian.koefisien || 0,
        jumlahAngkaKredit: penilaian.angkaKredit,
      }));

      // Calculate total AK
      let totalAngkaKredit = akList.reduce(
        (sum, item) => sum + item.jumlahAngkaKredit,
        0,
      );

      // Add AK Integrasi if enabled
      const employeeAkIntegrasi = angkaIntegrasi.find(
        (ai) => ai.pegawaiId === selectedPegawaiId,
      );
      const akIntegrasiValue =
        includeAkIntegrasi && employeeAkIntegrasi?.value
          ? employeeAkIntegrasi.value
          : 0;
      if (akIntegrasiValue > 0) {
        totalAngkaKredit += akIntegrasiValue;
      }

      // Add AK Pendidikan if enabled
      const akPendidikanValue = includeAkPendidikan
        ? getTotalAkPendidikanByPegawai(selectedPegawaiId)
        : 0;
      if (akPendidikanValue > 0) {
        totalAngkaKredit += akPendidikanValue;
      }

      // Create report data - single page with all periods
      const reportData = {
        nomor: selectedPegawaiId.slice(0, 8).toUpperCase(),
        tahun:
          employeePenilaian.length > 0
            ? new Date(employeePenilaian[0].tanggalAkhirPenilaian).getFullYear()
            : new Date().getFullYear(),
        namaInstansi: employeeInstansi?.name || "Instansi",
        periodeAwal:
          employeePenilaian.length > 0
            ? employeePenilaian[employeePenilaian.length - 1]
                .tanggalAwalPenilaian
            : "-",
        periodeAkhir:
          employeePenilaian.length > 0
            ? employeePenilaian[0].tanggalAkhirPenilaian
            : "-",
        pegawai: {
          nama: selectedEmployee?.nama || "-",
          nip: selectedEmployee?.nip || "-",
          noSeriKarpeg: selectedEmployee?.no_seri_karpeg || "-",
          tempatLahir: selectedEmployee?.tempat_lahir || "-",
          tanggalLahir: selectedEmployee?.tanggal_lahir || "-",
          jenisKelamin: selectedEmployee?.jenis_kelamin || "-",
          pangkat: selectedEmployee?.pangkat || "-",
          golongan: selectedEmployee?.golongan || "-",
          tmtPangkat: selectedEmployee?.tmt_pangkat || "-",
          unitKerja: selectedEmployee?.unit_kerja || "-",
        },
        jabatanDanTmt: `${selectedEmployee?.jabatan || "-"} / ${selectedEmployee?.tmt_jabatan || "-"}`,
        includeAngkaIntegrasi: akIntegrasiValue > 0,
        angkaIntegrasiValue: akIntegrasiValue,
        includeAkPendidikan: akPendidikanValue > 0,
        akPendidikanValue: akPendidikanValue,
        akList: akList,
        totalAngkaKredit: totalAngkaKredit,
        tempatDitetapkan:
          employeePenilaian.length > 0
            ? employeePenilaian[0].tempatDitetapkan
            : "-",
        tanggalDitetapkan:
          employeePenilaian.length > 0
            ? employeePenilaian[0].tanggalDitetapkan
            : "-",
        penilai: {
          nama: penilai?.nama || "-",
          pangkat: penilai?.pangkat || "-",
          golongan: penilai?.golongan || "-",
          nip: penilai?.nip || "-",
        },
      };

      // Create single page document
      const doc = (
        <Document>
          <AkumulasiReportPage {...reportData} />
        </Document>
      );

      // Generate blob
      const blob = await pdf(doc).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `akumulasi-${selectedEmployee?.nama?.replace(/\s+/g, "-") || "pegawai"}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cetak Akumulasi Angka Kredit</h1>
          <p className="text-muted-foreground mt-1">
            Cetak dokumen akumulasi angka kredit untuk satu pegawai (semua
            periode dalam satu halaman)
          </p>
        </div>
        <Button
          onClick={handleOpenDialog}
          disabled={isGenerating || penilaianAK.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? "Membuat PDF..." : "Cetak PDF Akumulasi"}
        </Button>
      </div>

      <div className="border rounded-lg p-6 bg-muted/50">
        <h2 className="font-semibold mb-2">Informasi Data</h2>
        <div className="space-y-1 text-sm">
          <p>
            Total Penilaian: <strong>{penilaianAK.length}</strong>
          </p>
          <p>
            Total Pegawai: <strong>{employeesWithAssessments.length}</strong>
          </p>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfigurasi Cetak Akumulasi</DialogTitle>
            <DialogDescription>
              Pilih 1 pegawai untuk dicetak (semua periode dalam 1 halaman)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee Selection - Single Select */}
            <div className="space-y-2">
              <Label htmlFor="pegawai" className="font-semibold">
                Pilih Pegawai
              </Label>
              <Select
                value={selectedPegawaiId}
                onValueChange={setSelectedPegawaiId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pegawai..." />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithAssessments
                    .sort((a, b) => a.nama.localeCompare(b.nama))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} ({p.nip})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedPegawaiId && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium">
                    Periode yang akan dicetak:
                  </p>
                  {employeePeriods.map((pn, idx) => (
                    <div
                      key={pn.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <div className="w-4 h-4 border rounded flex items-center justify-center bg-muted">
                        <span className="text-xs">✓</span>
                      </div>
                      <span>
                        {pn.tanggalAwalPenilaian} s.d.{" "}
                        {pn.tanggalAkhirPenilaian}
                        <span className="text-muted-foreground ml-2">
                          ({pn.predikat} - {pn.angkaKredit.toFixed(2)} AK)
                        </span>
                      </span>
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: <strong>{employeePeriods.length}</strong> periode
                  </p>
                </div>
              )}
            </div>

            {/* AK Integrasi */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="akIntegrasi"
                  checked={includeAkIntegrasi}
                  onCheckedChange={(checked) =>
                    setIncludeAkIntegrasi(checked as boolean)
                  }
                />
                <Label
                  htmlFor="akIntegrasi"
                  className="font-semibold cursor-pointer"
                >
                  Sertakan AK Integrasi
                </Label>
              </div>
            </div>

            {/* AK Pendidikan */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="akPendidikan"
                  checked={includeAkPendidikan}
                  onCheckedChange={(checked) =>
                    setIncludeAkPendidikan(checked as boolean)
                  }
                />
                <Label
                  htmlFor="akPendidikan"
                  className="font-semibold cursor-pointer"
                >
                  Sertakan AK Pendidikan
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleGeneratePDF} disabled={!selectedPegawaiId}>
              <Download className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
