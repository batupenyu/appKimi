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
import { AkumulasiReportPage } from "./ui/AkumulasiReportPDF";
import { 
  usePenilaianAngkaKreditStorage,
  useAngkaIntegrasiStorage, 
  useAkPendidikanStorage,
  usePegawaiStorage,
  useInstansiStorage
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
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);

  // Extract unique periods from penilaianAK
  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>();
    penilaianAK.forEach(p => {
      const key = `${p.tanggalAwalPenilaian}|${p.tanggalAkhirPenilaian}`;
      periods.add(key);
    });
    return Array.from(periods).map(key => {
      const [start, end] = key.split('|');
      return { key, start, end, label: `${start} s.d. ${end}` };
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [penilaianAK]);

  // Get unique employees from penilaianAK
  const employeesWithAssessments = useMemo(() => {
    const uniqueIds = new Set(penilaianAK.map(p => p.pegawaiId));
    return pegawai.filter(p => uniqueIds.has(p.id));
  }, [penilaianAK, pegawai]);

  const handleOpenDialog = () => {
    if (penilaianAK.length === 0) {
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
      let filteredPenilaian = penilaianAK;

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
        const employeePegawai = pegawai.find(p => p.id === penilaian.pegawaiId);
        const employeeInstansi = instansi.find(i => i.id === penilaian.instansiId);
        const penilai = pegawai.find(p => p.id === penilaian.penilaiId);

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
          namaInstansi: employeeInstansi?.name || "Instansi",
          periodeAwal: penilaian.tanggalAwalPenilaian,
          periodeAkhir: penilaian.tanggalAkhirPenilaian,
          pegawai: {
            nama: employeePegawai?.nama || "-",
            nip: employeePegawai?.nip || "-",
            noSeriKarpeg: employeePegawai?.no_seri_karpeg || "-",
            tempatLahir: employeePegawai?.tempat_lahir || "-",
            tanggalLahir: employeePegawai?.tanggal_lahir || "-",
            jenisKelamin: employeePegawai?.jenis_kelamin || "-",
            pangkat: employeePegawai?.pangkat || "-",
            golongan: employeePegawai?.golongan || "-",
            tmtPangkat: employeePegawai?.tmt_pangkat || "-",
            unitKerja: employeePegawai?.unit_kerja || "-",
          },
          jabatanDanTmt: `${employeePegawai?.jabatan || "-"} / ${employeePegawai?.tmt_jabatan || "-"}`,
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
            <AkumulasiReportPage key={index} {...reportData} />
          ))}
        </Document>
      );

      // Generate blob
      const blob = await pdf(doc).toBlob();
      
      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `akumulasi-angka-kredit-${reports.length}-pegawai.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating multi PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF akumulasi. Silakan coba lagi.");
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
            Cetak dokumen akumulasi angka kredit untuk pegawai terpilih
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
          <p>Total Penilaian: <strong>{penilaianAK.length}</strong></p>
          <p>Total Pegawai: <strong>{employeesWithAssessments.length}</strong></p>
          <p>Total Periode: <strong>{uniquePeriods.length}</strong></p>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Konfigurasi Cetak Akumulasi</DialogTitle>
            <DialogDescription>
              Pilih pegawai dan opsi untuk menyertakan dalam PDF akumulasi
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
    </div>
  );
}
