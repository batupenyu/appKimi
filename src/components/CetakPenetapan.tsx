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
import { Download, FileText } from "lucide-react";
import { pdf, Document } from "@react-pdf/renderer";
import { PenetapanReportPage } from "./ui/PenetapanReportPDF";
import {
  usePenilaianAngkaKreditStorage,
  useAngkaIntegrasiStorage,
  useAkPendidikanStorage,
  usePegawaiStorage,
  useInstansiStorage,
} from "@/hooks/useStorage";
import { calculateTargetAK } from "@/utils/calculations";

export function CetakPenetapan() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Fetch data from storage
  const { penilaianAK } = usePenilaianAngkaKreditStorage();
  const { pegawai } = usePegawaiStorage();
  const { instansi } = useInstansiStorage();
  const { angkaIntegrasi } = useAngkaIntegrasiStorage();
  const { getTotalAkPendidikanByPegawai } = useAkPendidikanStorage();

  // Configuration state
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string[]>([]);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);

  // Get unique employees from penilaianAK
  const employeesWithAssessments = useMemo(() => {
    const uniqueIds = new Set(penilaianAK.map((p) => p.pegawaiId));
    return pegawai.filter((p) => uniqueIds.has(p.id));
  }, [penilaianAK, pegawai]);

  // Get all periods for selected employee
  const employeePeriods = useMemo(() => {
    if (!selectedPegawaiId.length) return [];
    return penilaianAK
      .filter((p) => selectedPegawaiId.includes(p.pegawaiId))
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
    if (selectedPegawaiId.length === 0) {
      alert("Silakan pilih setidaknya 1 pegawai");
      return;
    }

    setShowDialog(false);
    setIsGenerating(true);

    try {
      const filteredPenilaian = employeePeriods.filter((pn) =>
        selectedPeriodIds.includes(pn.id),
      );

      // Generate one page per penilaian (like KonversiMulti)
      const doc = (
        <Document>
          {filteredPenilaian.map((penilaian) => {
            const selectedEmployee = pegawai.find(
              (p) => p.id === penilaian.pegawaiId,
            );
            const employeeInstansi = instansi.find(
              (i) => i.id === penilaian.instansiId,
            );
            const penilai = pegawai.find((p) => p.id === penilaian.penilaiId);

            // Calculate AK for this single period
            const employeeAkIntegrasi = angkaIntegrasi.find(
              (ai) => ai.pegawaiId === penilaian.pegawaiId,
            );
            const akIntegrasiValue = employeeAkIntegrasi?.value
              ? employeeAkIntegrasi.value
              : 0;
            const akPendidikanValue = getTotalAkPendidikanByPegawai(
              penilaian.pegawaiId,
            );
            const totalAngkaKredit =
              penilaian.angkaKredit + akIntegrasiValue + akPendidikanValue;

            // Calculate Target AK for Next Rank/Jenjang
            const calculation = calculateTargetAK(
              selectedEmployee?.golongan || "",
              totalAngkaKredit,
            );

            return (
              <PenetapanReportPage
                key={penilaian.id}
                nomor={penilaian.id.slice(0, 8).toUpperCase()}
                tahun={new Date(penilaian.tanggalAkhirPenilaian).getFullYear()}
                namaInstansi={employeeInstansi?.name || "Instansi"}
                periodeAwal={penilaian.tanggalAwalPenilaian}
                periodeAkhir={penilaian.tanggalAkhirPenilaian}
                pegawai={{
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
                }}
                jabatanDanTmt={`${selectedEmployee?.jabatan || "-"} / ${selectedEmployee?.tmt_jabatan || "-"}`}
                includeAngkaIntegrasi={akIntegrasiValue > 0}
                angkaIntegrasiValue={akIntegrasiValue}
                includeAkPendidikan={akPendidikanValue > 0}
                akPendidikanValue={akPendidikanValue}
                akList={[
                  {
                    penilaian: penilaian.predikat,
                    prosentase: penilaian.prosentase || 0,
                    koefisien: penilaian.koefisien || 0,
                    jumlahAngkaKredit: penilaian.angkaKredit,
                  },
                ]}
                totalAngkaKredit={totalAngkaKredit}
                tempatDitetapkan={penilaian.tempatDitetapkan}
                tanggalDitetapkan={penilaian.tanggalDitetapkan}
                penilai={{
                  nama: penilai?.nama || "-",
                  pangkat: penilai?.pangkat || "-",
                  golongan: penilai?.golongan || "-",
                  nip: penilai?.nip || "-",
                }}
                {...calculation}
              />
            );
          })}
        </Document>
      );

      // Generate blob
      const blob = await pdf(doc).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `penetapan-multi-${filteredPenilaian.length}-periode.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle handlers
  const togglePegawai = (id: string) => {
    setSelectedPegawaiId((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const toggleAllPeriods = () => {
    if (selectedPeriodIds.length === employeePeriods.length) {
      setSelectedPeriodIds([]);
    } else {
      setSelectedPeriodIds(employeePeriods.map((p) => p.id));
    }
  };

  const togglePeriod = (id: string) => {
    setSelectedPeriodIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cetak Penetapan Angka Kredit</h1>
          <p className="text-muted-foreground mt-1">
            Cetak dokumen penetapan angka kredit untuk satu atau lebih periode
          </p>
        </div>
        <Button
          onClick={handleOpenDialog}
          disabled={isGenerating || penilaianAK.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? "Membuat PDF..." : "Cetak PDF Penetapan"}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Konfigurasi Cetak Penetapan</DialogTitle>
            <DialogDescription>
              Pilih pegawai dan periode yang akan dicetak
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">Pilih Pegawai</Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {employeesWithAssessments
                  .sort((a, b) => a.nama.localeCompare(b.nama))
                  .map((p) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`pegawai-${p.id}`}
                        checked={selectedPegawaiId.includes(p.id)}
                        onCheckedChange={() => togglePegawai(p.id)}
                      />
                      <Label
                        htmlFor={`pegawai-${p.id}`}
                        className="cursor-pointer"
                      >
                        {p.nama} ({p.nip})
                      </Label>
                    </div>
                  ))}
              </div>
            </div>

            {/* Period Selection (only show if employee selected) */}
            {selectedPegawaiId.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Pilih Periode</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAllPeriods}
                  >
                    {selectedPeriodIds.length === employeePeriods.length
                      ? "Unselect All"
                      : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded p-2">
                  {employeePeriods.map((pn) => (
                    <div key={pn.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`periode-${pn.id}`}
                        checked={selectedPeriodIds.includes(pn.id)}
                        onCheckedChange={() => togglePeriod(pn.id)}
                      />
                      <Label
                        htmlFor={`periode-${pn.id}`}
                        className="cursor-pointer flex-1"
                      >
                        <span className="font-medium">
                          {pn.tanggalAwalPenilaian} s.d.{" "}
                          {pn.tanggalAkhirPenilaian}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({pn.predikat} - {pn.angkaKredit.toFixed(2)} AK)
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: <strong>{selectedPeriodIds.length}</strong> of{" "}
                  {employeePeriods.length} periods
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={selectedPeriodIds.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF ({selectedPeriodIds.length} halaman)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
