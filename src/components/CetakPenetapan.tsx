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
import {
  JENJANG_TO_KOEFISIEN,
  getKoefisienByJenjang,
  PENILAIAN_TO_PROSENTASE,
} from "@/constants";
import { calculateMonthsBetween } from "@/utils/dateUtils";

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
  const [includeAkIntegrasi, setIncludeAkIntegrasi] = useState(false);
  const [includeAkPendidikan, setIncludeAkPendidikan] = useState(false);

  // Get unique employees from penilaianAK
  const employeesWithAssessments = useMemo(() => {
    const uniqueIds = new Set(penilaianAK.map((p) => p.pegawaiId));
    return pegawai.filter((p) => uniqueIds.has(p.id));
  }, [penilaianAK, pegawai]);

  // Get all periods for selected employees
  const employeePeriods = useMemo(() => {
    if (selectedPegawaiId.length === 0) return [];
    return penilaianAK
      .filter((p) => selectedPegawaiId.includes(p.pegawaiId))
      .sort(
        (a, b) =>
          new Date(b.tanggalAkhirPenilaian).getTime() -
          new Date(a.tanggalAkhirPenilaian).getTime(),
      );
  }, [selectedPegawaiId, penilaianAK]);

  // Toggle functions
  const togglePegawai = (id: string) => {
    setSelectedPegawaiId((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const togglePeriod = (id: string) => {
    setSelectedPeriodIds((prev) =>
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

  const handleOpenDialog = () => {
    if (penilaianAK.length === 0) {
      alert("Tidak ada data untuk dicetak");
      return;
    }
    setSelectedPegawaiId([]);
    setSelectedPeriodIds([]);
    setIncludeAkIntegrasi(false);
    setIncludeAkPendidikan(false);
    setShowDialog(true);
  };

  const handleGeneratePDF = async () => {
    if (selectedPegawaiId.length === 0) {
      alert("Silakan pilih setidaknya 1 pegawai");
      return;
    }
    if (selectedPeriodIds.length === 0) {
      alert("Silakan pilih setidaknya 1 periode");
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
            const penilai = instansi.find((i) => i.id === penilaian.penilaiId);

            // Calculate AK for this single period
            const employeeAkIntegrasi = angkaIntegrasi.find(
              (ai) => ai.pegawaiId === penilaian.pegawaiId,
            );
            const akIntegrasiValue =
              includeAkIntegrasi && employeeAkIntegrasi?.value
                ? employeeAkIntegrasi.value
                : 0;
            const akPendidikanValue = includeAkPendidikan
              ? getTotalAkPendidikanByPegawai(
                  penilaian.pegawaiId,
                  selectedEmployee?.golongan || "",
                )
              : 0;
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
                nomor={penilaian.id?.slice(0, 8) || "1"}
                tahun={new Date(
                  penilaian.tanggalAkhirPenilaian || new Date(),
                ).getFullYear()}
                namaInstansi={instansi[0]?.name || "DINAS PENDIDIKAN"}
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
                    koefisien: getKoefisienByJenjang(penilaian.jenjang),
                    jumlahAngkaKredit: Number(
                      ((calculateMonthsBetween(
                        penilaian.tanggalAwalPenilaian,
                        penilaian.tanggalAkhirPenilaian,
                      ) /
                        12) *
                        getKoefisienByJenjang(penilaian.jenjang) *
                        ((PENILAIAN_TO_PROSENTASE as any)[penilaian.predikat] ||
                          0)) /
                        100,
                    ),
                  },
                ]}
                totalAngkaKredit={totalAngkaKredit}
                tempatDitetapkan={penilaian.tempatDitetapkan}
                tanggalDitetapkan={penilaian.tanggalDitetapkan}
                penilai={{
                  nama: penilai?.name || "-",
                  pangkat: "-",
                  golongan: "-",
                  nip: "-",
                }}
                {...calculation}
              />
            );
          })}
        </Document>
      );

      // Generate blob
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `penetapan-angka-kredit-${filteredPenilaian.length}-periode.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
      setSelectedPegawaiId([]);
      setSelectedPeriodIds([]);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        disabled={isGenerating || penilaianAK.length === 0}
        variant="outline"
      >
        <FileText className="mr-2 h-4 w-4" />
        Cetak Penetapan
      </Button>

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

            {/* Include Options */}
            <div className="space-y-2">
              <Label className="font-semibold">Include Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAkIntegrasi"
                  checked={includeAkIntegrasi}
                  onCheckedChange={(checked) =>
                    setIncludeAkIntegrasi(!!checked)
                  }
                />
                <Label htmlFor="includeAkIntegrasi" className="cursor-pointer">
                  Include AK Integrasi
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAkPendidikan"
                  checked={includeAkPendidikan}
                  onCheckedChange={(checked) =>
                    setIncludeAkPendidikan(!!checked)
                  }
                />
                <Label htmlFor="includeAkPendidikan" className="cursor-pointer">
                  Include AK Pendidikan
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={
                selectedPegawaiId.length === 0 ||
                selectedPeriodIds.length === 0 ||
                isGenerating
              }
            >
              {isGenerating ? "Memproses..." : "Cetak PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
