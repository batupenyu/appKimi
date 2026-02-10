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
import { pdf, Document } from '@react-pdf/renderer';
import { KonversiReportPage } from "./ui/KonversiReportPDF";
import { useAngkaIntegrasiStorage, useAkPendidikanStorage } from "@/hooks/useStorage";
import type { 
  PenilaianAngkaKredit, 
  Pegawai, 
  Instansi 
} from "@/types";

interface CetakKonversiMultiProps {
  penilaianList: PenilaianAngkaKredit[];
  pegawaiList: Pegawai[];
  instansiList: Instansi[];
}

export function CetakKonversiMulti({ 
  penilaianList, 
  pegawaiList, 
  instansiList 
}: CetakKonversiMultiProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  // Fetch AK data from storage
  const { angkaIntegrasi } = useAngkaIntegrasiStorage();
  const { getTotalAkPendidikanByPegawai } = useAkPendidikanStorage();
  
  // Configuration state
  const [includeAkIntegrasi, setIncludeAkIntegrasi] = useState(false);
  const [includeAkPendidikan, setIncludeAkPendidikan] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);

  // Extract unique periods from penilaianList
  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>();
    penilaianList.forEach(p => {
      const key = `${p.tanggalAwalPenilaian}|${p.tanggalAkhirPenilaian}`;
      periods.add(key);
    });
    return Array.from(periods).map(key => {
      const [start, end] = key.split('|');
      return { key, start, end, label: `${start} s.d. ${end}` };
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [penilaianList]);

  // Get unique employees from penilaianList
  const employeesWithAssessments = useMemo(() => {
    const uniqueIds = new Set(penilaianList.map(p => p.pegawaiId));
    return pegawaiList.filter(p => uniqueIds.has(p.id));
  }, [penilaianList, pegawaiList]);

  const handleOpenDialog = () => {
    if (penilaianList.length === 0) {
      alert("Tidak ada data untuk dicetak");
      return;
    }
    setShowDialog(true);
  };

  const handleTogglePegawai = (pegawaiId: string) => {
    setSelectedPegawaiIds(prev => 
      prev.includes(pegawaiId) 
        ? prev.filter(id => id !== pegawaiId)
        : [...prev, pegawaiId]
    );
  };

  const handleSelectAllPegawai = () => {
    if (selectedPegawaiIds.length === employeesWithAssessments.length) {
      setSelectedPegawaiIds([]);
    } else {
      setSelectedPegawaiIds(employeesWithAssessments.map(p => p.id));
    }
  };

  const handleGenerateMultiPDF = async () => {
    // Validate: Must have either employees selected OR a period selected
    if (selectedPegawaiIds.length === 0 && (!selectedPeriod || selectedPeriod === "all")) {
      alert("Silakan pilih minimal 1 pegawai atau pilih periode spesifik");
      return;
    }

    setShowDialog(false);
    setIsGenerating(true);

    try {
      let filteredPenilaian = penilaianList;

      // Logic:
      // 1. If Employees are selected, we ignore Period filter (UI is hidden) and filter ONLY by Employee.
      // 2. If No Employees selected, we MUST have a Period selected, so we filter by Period.

      if (selectedPegawaiIds.length > 0) {
        // Filter by selected employees
        filteredPenilaian = filteredPenilaian.filter(p => 
          selectedPegawaiIds.includes(p.pegawaiId)
        );
      } else if (selectedPeriod && selectedPeriod !== "all") {
         // Filter by selected period
        const [start, end] = selectedPeriod.split('|');
        filteredPenilaian = filteredPenilaian.filter(p => 
          p.tanggalAwalPenilaian === start && p.tanggalAkhirPenilaian === end
        );
      }

      if (filteredPenilaian.length === 0) {
        alert("Tidak ada data yang sesuai dengan filter");
        setIsGenerating(false);
        return;
      }

      // Map all data to report format
      const reports = filteredPenilaian.map(penilaian => {
        const pegawai = pegawaiList.find(p => p.id === penilaian.pegawaiId) || {} as Pegawai;
        const instansi = instansiList.find(i => i.id === penilaian.instansiId);
        const penilai = pegawaiList.find(p => p.id === penilaian.penilaiId);

        // Get AK Integrasi value for this specific employee
        const employeeAkIntegrasi = angkaIntegrasi.find(ai => ai.pegawaiId === penilaian.pegawaiId);
        const akIntegrasiValue = employeeAkIntegrasi?.value || 0;

        // Get total AK Pendidikan for this specific employee
        const akPendidikanValue = getTotalAkPendidikanByPegawai(penilaian.pegawaiId);

        // Calculate total including AK Integrasi and AK Pendidikan if enabled
        let totalAngkaKredit = penilaian.angkaKredit;
        if (includeAkIntegrasi && akIntegrasiValue > 0) {
          totalAngkaKredit += akIntegrasiValue;
        }
        if (includeAkPendidikan && akPendidikanValue > 0) {
          totalAngkaKredit += akPendidikanValue;
        }

        return {
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
          includeAngkaIntegrasi: includeAkIntegrasi && akIntegrasiValue > 0,
          angkaIntegrasiValue: akIntegrasiValue,
          includeAkPendidikan: includeAkPendidikan && akPendidikanValue > 0,
          akPendidikanValue: akPendidikanValue,
          akList: [
            {
              penilaian: penilaian.predikat,
              prosentase: penilaian.prosentase || 0,
              koefisien: penilaian.koefisien || 0,
              jumlahAngkaKredit: penilaian.angkaKredit,
            },
          ],
          totalAngkaKredit: totalAngkaKredit,
          tempatDitetapkan: penilaian.tempatDitetapkan,
          tanggalDitetapkan: penilaian.tanggalDitetapkan,
          penilai: {
            nama: penilai?.nama || "-",
            pangkat: penilai?.pangkat || "-",
            golongan: penilai?.golongan || "-",
            nip: penilai?.nip || "-",
          },
        };
      });

      // Create a single document with multiple pages
      const doc = (
        <Document>
          {reports.map((reportData, index) => (
            <KonversiReportPage key={index} {...reportData} />
          ))}
        </Document>
      );

      // Generate blob
      const blob = await pdf(doc).toBlob();
      
      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `konversi-multi-${reports.length}-pegawai.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating multi PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF massal. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleOpenDialog}
        disabled={isGenerating || penilaianList.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? "Membuat PDF..." : "Cetak Semua PDF"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Konfigurasi Cetak Multi PDF</DialogTitle>
            <DialogDescription>
              Pilih pegawai dan opsi tambahan untuk menyertakan dalam PDF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Pilih Pegawai</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAllPegawai}
                >
                  {selectedPegawaiIds.length === employeesWithAssessments.length ? "Batal Semua" : "Pilih Semua"}
                </Button>
              </div>
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                {employeesWithAssessments.map(p => (
                  <div key={p.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pegawai-${p.id}`}
                      checked={selectedPegawaiIds.includes(p.id)}
                      onCheckedChange={() => handleTogglePegawai(p.id)}
                    />
                    <Label htmlFor={`pegawai-${p.id}`} className="cursor-pointer flex-1">
                      <span className="font-medium">{p.nama}</span>
                      <span className="text-sm text-muted-foreground ml-2">({p.nip})</span>
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Terpilih: <strong>{selectedPegawaiIds.length}</strong> dari {employeesWithAssessments.length} pegawai
              </p>
            </div>

            {/* Period Filter */}
            {/* Period Filter - Only show if no specific employees selected */
            selectedPegawaiIds.length === 0 && (
              <div className="space-y-2">
                <Label htmlFor="periode" className="font-semibold">Filter Periode (Opsional)</Label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih periode atau tampilkan semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Periode</SelectItem>
                    {uniquePeriods.map(period => (
                      <SelectItem key={period.key} value={period.key}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* AK Integrasi */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="akIntegrasi"
                  checked={includeAkIntegrasi}
                  onCheckedChange={(checked) => setIncludeAkIntegrasi(checked as boolean)}
                />
                <Label htmlFor="akIntegrasi" className="font-semibold cursor-pointer">
                  Sertakan AK Integrasi
                </Label>
              </div>
              {includeAkIntegrasi && (
                <p className="text-sm text-muted-foreground ml-6">
                  Nilai AK Integrasi akan diambil dari data masing-masing pegawai
                </p>
              )}
            </div>

            {/* AK Pendidikan */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="akPendidikan"
                  checked={includeAkPendidikan}
                  onCheckedChange={(checked) => setIncludeAkPendidikan(checked as boolean)}
                />
                <Label htmlFor="akPendidikan" className="font-semibold cursor-pointer">
                  Sertakan AK Pendidikan
                </Label>
              </div>
              {includeAkPendidikan && (
                <p className="text-sm text-muted-foreground ml-6">
                  Total AK Pendidikan akan diambil dari data masing-masing pegawai
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleGenerateMultiPDF}>
              <Download className="mr-2 h-4 w-4" />
              Generate PDF ({selectedPegawaiIds.length} Pegawai)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
