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
import {
  JENJANG_TO_KOEFISIEN,
  getKoefisienByJenjang,
  PENILAIAN_TO_PROSENTASE,
} from "@/constants";
import { calculateMonthsBetween } from "@/utils/dateUtils";

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
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<Set<string>>(
    new Set(),
  );

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
  }, [selectedPegawaiId, penilaianAK]);

  // Get selected employee info
  const selectedEmployee = useMemo(() => {
    return pegawai.find((p) => p.id === selectedPegawaiId);
  }, [selectedPegawaiId, pegawai]);

  // Reset selected periods when employee changes
  useMemo(() => {
    if (employeePeriods.length > 0) {
      setSelectedPeriodIds(new Set(employeePeriods.map((p) => p.id)));
    } else {
      setSelectedPeriodIds(new Set());
    }
  }, [employeePeriods]);

  // Get selected periods based on checkbox selection

  // Get instansi info
  const selectedInstansi = useMemo(() => {
    if (!selectedEmployee?.instansiId) return null;
    return instansi.find((i) => i.id === selectedEmployee.instansiId);
  }, [selectedEmployee, instansi]);

  const handleGeneratePDF = async () => {
    if (
      !selectedPegawaiId ||
      !selectedEmployee ||
      employeePeriods.length === 0 ||
      selectedPeriodIds.size === 0
    ) {
      alert("Pilih pegawai dengan data penilaian terlebih dahulu");
      return;
    }

    setIsGenerating(true);

    try {
      // Get only selected periods
      const employeePenilaian = employeePeriods.filter((p) =>
        selectedPeriodIds.has(p.id),
      );

      // Build akList with selected periods (recalculate AK using formula)
      const akList = employeePenilaian.map((penilaian) => {
        const koefisien = getKoefisienByJenjang(penilaian.jenjang);
        const prosentase =
          (PENILAIAN_TO_PROSENTASE as any)[penilaian.predikat] || 0;
        const months = calculateMonthsBetween(
          penilaian.tanggalAwalPenilaian,
          penilaian.tanggalAkhirPenilaian,
        );
        const jumlahAngkaKredit = (months / 12) * koefisien * (prosentase / 100);
        return {
          penilaian: penilaian.predikat,
          prosentase,
          koefisien,
          jumlahAngkaKredit,
        };
      });

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

      // Round the total to 2 decimal places for display
      totalAngkaKredit = Math.round(totalAngkaKredit * 100) / 100;

      // Create PDF document
      const doc = (
        <Document>
          <AkumulasiReportPage
            nomor={employeePeriods[0]?.id?.slice(0, 8) || "1"}
            tahun={new Date(
              employeePeriods[0]?.tanggalAkhirPenilaian || new Date(),
            ).getFullYear()}
            namaInstansi={selectedInstansi?.nama || "DINAS PENDIDIKAN"}
            periodeAwal={employeePeriods[0]?.tanggalAwalPenilaian || "-"}
            periodeAkhir={
              employeePeriods[employeePeriods.length - 1]
                ?.tanggalAkhirPenilaian || "-"
            }
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
            akList={akList}
            totalAngkaKredit={totalAngkaKredit}
            tempatDitetapkan={employeePeriods[0]?.tempatDitetapkan || "-"}
            tanggalDitetapkan={employeePeriods[0]?.tanggalDitetapkan || "-"}
            penilai={(() => {
              // Try to get penilai from the first penilaian record
              const firstPenilaian = employeePeriods[0];
              if (firstPenilaian?.penilaiId) {
                const penilai = pegawai.find(p => p.id === firstPenilaian.penilaiId);
                if (penilai) {
                  return {
                    nama: penilai.nama || "-",
                    pangkat: penilai.pangkat || "-",
                    golongan: penilai.golongan || "-",
                    nip: penilai.nip || "-",
                  };
                }
              }
              // Fallback to instansi data if penilai not found in penilaian
              return {
                nama: selectedInstansi?.namaPenilai || "-",
                pangkat: selectedInstansi?.pangkatPenilai || "-",
                golongan: selectedInstansi?.golonganPenilai || "-",
                nip: selectedInstansi?.nipPenilai || "-",
              };
            })()}
          />
        </Document>
      );

      // Generate blob
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `akumulasi-angka-kredit-${selectedEmployee?.nama || "pegawai"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setShowDialog(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Cetak Akumulasi
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cetak Akumulasi Angka Kredit</DialogTitle>
            <DialogDescription>
              Pilih pegawai dan konfigurasi untuk menghasilkan PDF akumulasi
              angka kredit.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pegawai" className="text-right">
                Pegawai
              </Label>
              <Select
                value={selectedPegawaiId}
                onValueChange={setSelectedPegawaiId}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Pilih Pegawai" />
                </SelectTrigger>
                <SelectContent>
                  {employeesWithAssessments.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nama} - {emp.nip}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Periode</Label>
              <div className="col-span-3 font-medium">
                {employeePeriods.length} periode penilaian
              </div>
            </div>

            {employeePeriods.length > 0 && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">Pilih Periode</Label>
                <div className="col-span-3 text-sm">
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPeriodIds(
                          new Set(employeePeriods.map((p) => p.id)),
                        )
                      }
                      className="text-xs underline mr-2 text-blue-600"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPeriodIds(new Set())}
                      className="text-xs underline text-blue-600"
                    >
                      Deselect All
                    </button>
                  </div>
                  {employeePeriods.map((period) => (
                    <div
                      key={period.id}
                      className="flex items-center gap-2 mb-1"
                    >
                      <Checkbox
                        id={`period-${period.id}`}
                        checked={selectedPeriodIds.has(period.id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedPeriodIds);
                          if (checked) {
                            newSet.add(period.id);
                          } else {
                            newSet.delete(period.id);
                          }
                          setSelectedPeriodIds(newSet);
                        }}
                      />
                      <Label
                        htmlFor={`period-${period.id}`}
                        className="cursor-pointer"
                      >
                        {period.tanggalAwalPenilaian} s.d.{" "}
                        {period.tanggalAkhirPenilaian}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="akIntegrasi" className="text-right">
                Include AK Integrasi
              </Label>
              <Checkbox
                id="akIntegrasi"
                checked={includeAkIntegrasi}
                onCheckedChange={(checked) => setIncludeAkIntegrasi(!!checked)}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="akPendidikan" className="text-right">
                Include AK Pendidikan
              </Label>
              <Checkbox
                id="akPendidikan"
                checked={includeAkPendidikan}
                onCheckedChange={(checked) => setIncludeAkPendidikan(!!checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={
                !selectedPegawaiId ||
                employeePeriods.length === 0 ||
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
