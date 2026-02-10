import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pdf, Document } from "@react-pdf/renderer";
import { KonversiReportPage } from "@/components/ui/KonversiReportPDF";
import {
  usePenilaianAngkaKreditStorage,
  usePegawaiStorage,
  useInstansiStorage,
  useAngkaIntegrasiStorage,
  useAkPendidikanStorage,
} from "@/hooks/useStorage";
import {
  JENJANG_OPTIONS,
  PENILAIAN_OPTIONS,
  PENILAIAN_TO_PROSENTASE,
  JENJANG_TO_KOEFISIEN,
} from "@/constants";
import { toast } from "sonner";
import { calculateMonthsBetween } from "@/utils/dateUtils";

const ITEMS_PER_PAGE = 10;

interface PenilaianFormData {
  pegawaiId: string;
  instansiId: string;
  penilaiId: string;
  jenjang: string;
  predikat: string;
  tanggalAwalPenilaian: string;
  tanggalAkhirPenilaian: string;
  tanggalDitetapkan: string;
  tempatDitetapkan: string;
}

const INITIAL_FORM_DATA: PenilaianFormData = {
  pegawaiId: "",
  instansiId: "",
  penilaiId: "",
  jenjang: "",
  predikat: "",
  tanggalAwalPenilaian: "",
  tanggalAkhirPenilaian: "",
  tanggalDitetapkan: "",
  tempatDitetapkan: "",
};

export function PenilaianAngkaKreditManager() {
  const { penilaianAK, addPenilaianAK, updatePenilaianAK, deletePenilaianAK } =
    usePenilaianAngkaKreditStorage();
  const { pegawai } = usePegawaiStorage();
  const { instansi } = useInstansiStorage();
  const { angkaIntegrasi } = useAngkaIntegrasiStorage();
  const { getTotalAkPendidikanByPegawai } = useAkPendidikanStorage();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPenilaian, setSelectedPenilaian] = useState<
    (typeof penilaianAK)[0] | null
  >(null);
  const [isCetakMultiDialogOpen, setIsCetakMultiDialogOpen] = useState(false);
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [includeAkIntegrasi, setIncludeAkIntegrasi] = useState<boolean>(false);
  const [includeAkPendidikan, setIncludeAkPendidikan] =
    useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] =
    useState<PenilaianFormData>(INITIAL_FORM_DATA);

  // Pegawai lookup maps
  const pegawaiMap = useMemo(() => {
    const map = new Map();
    pegawai.forEach((p) => map.set(p.id, p));
    return map;
  }, [pegawai]);

  // Calculate values
  const calculatedValues = useMemo(() => {
    const prosentase = formData.predikat
      ? (PENILAIAN_TO_PROSENTASE as any)[formData.predikat] || 0
      : 0;
    const koefisien = formData.jenjang
      ? (JENJANG_TO_KOEFISIEN as any)[formData.jenjang] || 0
      : 0;

    // Calculate months between start and end dates
    const months =
      formData.tanggalAwalPenilaian && formData.tanggalAkhirPenilaian
        ? calculateMonthsBetween(
            formData.tanggalAwalPenilaian,
            formData.tanggalAkhirPenilaian,
          )
        : 0;

    // Calculate angka kredit: (months/12) * koefisien * (prosentase / 100)
    const angkaKredit = Math.round(
      (months / 12) * koefisien * (prosentase / 100),
    );

    return { prosentase, koefisien, angkaKredit, months };
  }, [
    formData.predikat,
    formData.jenjang,
    formData.tanggalAwalPenilaian,
    formData.tanggalAkhirPenilaian,
  ]);

  // Filter and paginate
  const filteredData = useMemo(() => {
    if (!searchQuery) return penilaianAK;
    const query = searchQuery.toLowerCase();
    return penilaianAK.filter(
      (item) =>
        pegawaiMap.get(item.pegawaiId)?.nama?.toLowerCase().includes(query) ||
        pegawaiMap.get(item.pegawaiId)?.nip?.toLowerCase().includes(query) ||
        item.jenjang.toLowerCase().includes(query),
    );
  }, [penilaianAK, searchQuery, pegawaiMap]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleAdd = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: (typeof penilaianAK)[0]) => {
    setSelectedPenilaian(item);
    setFormData({
      pegawaiId: item.pegawaiId,
      instansiId: item.instansiId,
      penilaiId: item.penilaiId,
      jenjang: item.jenjang,
      predikat: item.predikat,
      tanggalAwalPenilaian: item.tanggalAwalPenilaian,
      tanggalAkhirPenilaian: item.tanggalAkhirPenilaian,
      tanggalDitetapkan: item.tanggalDitetapkan,
      tempatDitetapkan: item.tempatDitetapkan,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: (typeof penilaianAK)[0]) => {
    setSelectedPenilaian(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmAdd = () => {
    if (!formData.pegawaiId) {
      toast.error("Pilih pegawai terlebih dahulu");
      return;
    }
    if (!formData.instansiId) {
      toast.error("Pilih instansi terlebih dahulu");
      return;
    }
    if (!formData.penilaiId) {
      toast.error("Pilih penilai terlebih dahulu");
      return;
    }
    if (!formData.jenjang) {
      toast.error("Pilih jenjang terlebih dahulu");
      return;
    }
    if (!formData.predikat) {
      toast.error("Pilih predikat terlebih dahulu");
      return;
    }
    if (!formData.tanggalAwalPenilaian || !formData.tanggalAkhirPenilaian) {
      toast.error("Isi tanggal penilaian");
      return;
    }
    if (!formData.tanggalDitetapkan || !formData.tempatDitetapkan) {
      toast.error("Isi tanggal dan tempat ditetapkan");
      return;
    }

    const { prosentase, koefisien, angkaKredit } = calculatedValues;

    addPenilaianAK({
      pegawaiId: formData.pegawaiId,
      instansiId: formData.instansiId,
      penilaiId: formData.penilaiId,
      jenjang: formData.jenjang,
      predikat: formData.predikat,
      tanggalAwalPenilaian: formData.tanggalAwalPenilaian,
      tanggalAkhirPenilaian: formData.tanggalAkhirPenilaian,
      tanggalDitetapkan: formData.tanggalDitetapkan,
      tempatDitetapkan: formData.tempatDitetapkan,
      prosentase,
      koefisien,
      angkaKredit,
    });

    toast.success("Penilaian Angka Kredit berhasil ditambahkan");
    setIsAddDialogOpen(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const confirmDelete = () => {
    if (!selectedPenilaian) return;
    deletePenilaianAK(selectedPenilaian.id);
    toast.success("Penilaian Angka Kredit berhasil dihapus");
    setIsDeleteDialogOpen(false);
    setSelectedPenilaian(null);
  };

  const confirmEdit = () => {
    if (!selectedPenilaian) return;
    if (!formData.pegawaiId) {
      toast.error("Pilih pegawai terlebih dahulu");
      return;
    }
    if (!formData.instansiId) {
      toast.error("Pilih instansi terlebih dahulu");
      return;
    }
    if (!formData.penilaiId) {
      toast.error("Pilih penilai terlebih dahulu");
      return;
    }
    if (!formData.jenjang) {
      toast.error("Pilih jenjang terlebih dahulu");
      return;
    }
    if (!formData.predikat) {
      toast.error("Pilih predikat terlebih dahulu");
      return;
    }
    if (!formData.tanggalAwalPenilaian || !formData.tanggalAkhirPenilaian) {
      toast.error("Isi tanggal penilaian");
      return;
    }
    if (!formData.tanggalDitetapkan || !formData.tempatDitetapkan) {
      toast.error("Isi tanggal dan tempat ditetapkan");
      return;
    }

    const { prosentase, koefisien, angkaKredit } = calculatedValues;

    updatePenilaianAK(selectedPenilaian.id, {
      pegawaiId: formData.pegawaiId,
      instansiId: formData.instansiId,
      penilaiId: formData.penilaiId,
      jenjang: formData.jenjang,
      predikat: formData.predikat,
      tanggalAwalPenilaian: formData.tanggalAwalPenilaian,
      tanggalAkhirPenilaian: formData.tanggalAkhirPenilaian,
      tanggalDitetapkan: formData.tanggalDitetapkan,
      tempatDitetapkan: formData.tempatDitetapkan,
      prosentase,
      koefisien,
      angkaKredit,
    });

    toast.success("Penilaian Angka Kredit berhasil diperbarui");
    setIsEditDialogOpen(false);
    setSelectedPenilaian(null);
  };

  // Recalculate all existing penilaian AK with the new formula
  const recalculateAllAngkaKredit = () => {
    penilaianAK.forEach((item) => {
      const months = calculateMonthsBetween(
        item.tanggalAwalPenilaian,
        item.tanggalAkhirPenilaian,
      );
      const koefisien = (JENJANG_TO_KOEFISIEN as any)[item.jenjang] || 0;
      const prosentase = (PENILAIAN_TO_PROSENTASE as any)[item.predikat] || 0;
      const angkaKredit = Math.round(
        (months / 12) * koefisien * (prosentase / 100),
      );

      updatePenilaianAK(item.id, { angkaKredit });
    });
    toast.success("Semua angka kredit telah dihitung ulang");
  };

  // Multi-print handlers
  const handleOpenCetakMultiDialog = () => {
    if (penilaianAK.length === 0) {
      toast.error("Tidak ada data untuk dicetak");
      return;
    }
    setSelectedPegawaiIds([]);
    setSelectedPeriodIds([]);
    setIncludeAkIntegrasi(false);
    setIncludeAkPendidikan(false);
    setIsCetakMultiDialogOpen(true);
  };

  // Get unique employees with penilaian
  const employeesWithPenilaian = useMemo(() => {
    const uniquePegawaiIds = new Set(penilaianAK.map((p) => p.pegawaiId));
    return pegawai.filter((p) => uniquePegawaiIds.has(p.id));
  }, [penilaianAK, pegawai]);

  // Get all periods for selected employees
  const employeePeriods = useMemo(() => {
    if (!selectedPegawaiIds.length) return [];
    return penilaianAK
      .filter((p) => selectedPegawaiIds.includes(p.pegawaiId))
      .sort(
        (a, b) =>
          new Date(b.tanggalAkhirPenilaian).getTime() -
          new Date(a.tanggalAkhirPenilaian).getTime(),
      );
  }, [penilaianAK, selectedPegawaiIds]);

  const togglePegawai = (id: string) => {
    setSelectedPegawaiIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const toggleAllPegawai = () => {
    if (selectedPegawaiIds.length === employeesWithPenilaian.length) {
      setSelectedPegawaiIds([]);
    } else {
      setSelectedPegawaiIds(employeesWithPenilaian.map((p) => p.id));
    }
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

  const handleGenerateMultiPDF = async () => {
    if (selectedPeriodIds.length === 0) {
      toast.error("Pilih setidaknya 1 periode untuk dicetak");
      return;
    }

    setIsCetakMultiDialogOpen(false);
    setIsGenerating(true);

    try {
      const selectedPenilaianList = employeePeriods.filter((p) =>
        selectedPeriodIds.includes(p.id),
      );

      const doc = (
        <Document>
          {selectedPenilaianList.map((penilaian) => {
            const selectedEmployee = pegawaiMap.get(penilaian.pegawaiId);
            const employeeInstansi = instansi.find(
              (i) => i.id === penilaian.instansiId,
            );
            const penilai = pegawai.find((p) => p.id === penilaian.penilaiId);

            // Get AK Integrasi for this employee
            const employeeAkIntegrasi = angkaIntegrasi.find(
              (ai) => ai.pegawaiId === penilaian.pegawaiId,
            );
            const akIntegrasiValue =
              includeAkIntegrasi && employeeAkIntegrasi
                ? employeeAkIntegrasi.value
                : 0;

            // Get AK Pendidikan for this employee
            const akPendidikanValue = includeAkPendidikan
              ? getTotalAkPendidikanByPegawai(penilaian.pegawaiId)
              : 0;

            // Total AK including integrasi and pendidikan
            const totalAngkaKredit =
              penilaian.angkaKredit + akIntegrasiValue + akPendidikanValue;

            return (
              <KonversiReportPage
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
              />
            );
          })}
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `konversi-angka-kredit-${selectedPeriodIds.length}-periode.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(
        `PDF berhasil dibuat untuk ${selectedPeriodIds.length} periode`,
      );
      setSelectedPegawaiIds([]);
      setSelectedPeriodIds([]);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Terjadi kesalahan saat membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderForm = () => (
    <div className="space-y-4">
      {/* Pegawai Selection */}
      <div className="space-y-2">
        <Label htmlFor="pegawai">Pegawai *</Label>
        <Select
          value={formData.pegawaiId}
          onValueChange={(value) =>
            setFormData({ ...formData, pegawaiId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih pegawai" />
          </SelectTrigger>
          <SelectContent>
            {pegawai.length === 0 ? (
              <SelectItem value="" disabled>
                Tidak ada pegawai tersedia
              </SelectItem>
            ) : (
              pegawai.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nama} - {p.nip}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Instansi Selection */}
      <div className="space-y-2">
        <Label htmlFor="instansi">Instansi *</Label>
        <Select
          value={formData.instansiId}
          onValueChange={(value) =>
            setFormData({ ...formData, instansiId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih instansi" />
          </SelectTrigger>
          <SelectContent>
            {instansi.length === 0 ? (
              <SelectItem value="" disabled>
                Tidak ada instansi tersedia
              </SelectItem>
            ) : (
              instansi.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Penilai Selection */}
      <div className="space-y-2">
        <Label htmlFor="penilai">Penilai *</Label>
        <Select
          value={formData.penilaiId}
          onValueChange={(value) =>
            setFormData({ ...formData, penilaiId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih penilai" />
          </SelectTrigger>
          <SelectContent>
            {pegawai.length === 0 ? (
              <SelectItem value="" disabled>
                Tidak ada pegawai tersedia
              </SelectItem>
            ) : (
              pegawai.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nama} - {p.nip}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Jenjang Selection */}
      <div className="space-y-2">
        <Label htmlFor="jenjang">Jenjang *</Label>
        <Select
          value={formData.jenjang}
          onValueChange={(value) =>
            setFormData({ ...formData, jenjang: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenjang" />
          </SelectTrigger>
          <SelectContent>
            {JENJANG_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Predikat Selection */}
      <div className="space-y-2">
        <Label htmlFor="predikat">Predikat *</Label>
        <Select
          value={formData.predikat}
          onValueChange={(value) =>
            setFormData({ ...formData, predikat: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih predikat" />
          </SelectTrigger>
          <SelectContent>
            {PENILAIAN_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({(PENILAIAN_TO_PROSENTASE as any)[option.value]}
                %)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tanggal Penilaian */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tanggalAwal">Tanggal Awal Penilaian *</Label>
          <Input
            id="tanggalAwal"
            type="date"
            value={formData.tanggalAwalPenilaian}
            onChange={(e) =>
              setFormData({ ...formData, tanggalAwalPenilaian: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tanggalAkhir">Tanggal Akhir Penilaian *</Label>
          <Input
            id="tanggalAkhir"
            type="date"
            value={formData.tanggalAkhirPenilaian}
            onChange={(e) =>
              setFormData({
                ...formData,
                tanggalAkhirPenilaian: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Tanggal dan Tempat Ditetapkan */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tanggalDitetapkan">Tanggal Ditetapkan *</Label>
          <Input
            id="tanggalDitetapkan"
            type="date"
            value={formData.tanggalDitetapkan}
            onChange={(e) =>
              setFormData({ ...formData, tanggalDitetapkan: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tempatDitetapkan">Tempat Ditetapkan *</Label>
          <Input
            id="tempatDitetapkan"
            type="text"
            value={formData.tempatDitetapkan}
            onChange={(e) =>
              setFormData({ ...formData, tempatDitetapkan: e.target.value })
            }
            placeholder="Masukkan tempat"
          />
        </div>
      </div>

      {/* Calculated Values */}
      {(formData.jenjang || formData.predikat) && (
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <Label className="text-muted-foreground">Hasil Perhitungan</Label>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Prosentase:</span>{" "}
              <span className="font-medium">
                {calculatedValues.prosentase}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Koefisien:</span>{" "}
              <span className="font-medium">{calculatedValues.koefisien}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Durasi (bulan):</span>{" "}
              <span className="font-medium">{calculatedValues.months}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Angka Kredit:</span>{" "}
              <Badge variant="default" className="font-mono">
                {calculatedValues.angkaKredit.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Buat Angka Kredit
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleOpenCetakMultiDialog}
              disabled={penilaianAK.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Cetak Multi PDF
            </Button>
            <Button
              onClick={handleAdd}
              disabled={pegawai.length === 0 || instansi.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Penilaian
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">Total: {penilaianAK.length} data</Badge>
            <Button variant="outline" onClick={recalculateAllAngkaKredit}>
              Recalculate All AK
            </Button>
          </div>

          {pegawai.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                Belum ada data pegawai. Silakan tambah pegawai terlebih dahulu.
              </p>
            </div>
          )}

          {instansi.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                Belum ada data instansi. Silakan tambah instansi terlebih
                dahulu.
              </p>
            </div>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Pegawai</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead>Predikat</TableHead>
                  <TableHead className="text-right">Prosentase</TableHead>
                  <TableHead className="text-right">Koefisien</TableHead>
                  <TableHead className="text-right">Angka Kredit</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery
                        ? "Tidak ada data yang sesuai"
                        : "Belum ada data penilaian angka kredit"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {pegawaiMap.get(item.pegawaiId)?.nama || "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {pegawaiMap.get(item.pegawaiId)?.nip || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{item.jenjang}</TableCell>
                      <TableCell>{item.predikat}</TableCell>
                      <TableCell className="text-right">
                        {item.prosentase}%
                      </TableCell>
                      <TableCell className="text-right">
                        {item.koefisien}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="font-mono">
                          {item.angkaKredit.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Penilaian Angka Kredit</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk membuat penilaian angka kredit.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmAdd}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Penilaian Angka Kredit</DialogTitle>
            <DialogDescription>
              Perbarui data penilaian angka kredit.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={confirmEdit}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Penilaian Angka Kredit</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus penilaian ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-print Dialog */}
      <Dialog
        open={isCetakMultiDialogOpen}
        onOpenChange={setIsCetakMultiDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cetak Multi PDF Konversi Angka Kredit</DialogTitle>
            <DialogDescription>
              Pilih pegawai dan periode yang akan dicetak dalam PDF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">Pilih Pegawai</Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {employeesWithPenilaian.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Tidak ada pegawai dengan penilaian
                  </p>
                ) : (
                  employeesWithPenilaian
                    .sort((a, b) => a.nama.localeCompare(b.nama))
                    .map((p) => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pegawai-${p.id}`}
                          checked={selectedPegawaiIds.includes(p.id)}
                          onCheckedChange={() => togglePegawai(p.id)}
                        />
                        <Label
                          htmlFor={`pegawai-${p.id}`}
                          className="cursor-pointer"
                        >
                          {p.nama} ({p.nip})
                        </Label>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Period Selection (only show if employee selected) */}
            {selectedPegawaiIds.length > 0 && (
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

            {/* AK Options */}
            <div className="space-y-2">
              <Label className="font-semibold">Opsi Angka Kredit</Label>
              <div className="grid grid-cols-2 gap-4 border rounded p-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-ak-integrasi"
                    checked={includeAkIntegrasi}
                    onCheckedChange={(checked) =>
                      setIncludeAkIntegrasi(checked === true)
                    }
                  />
                  <Label
                    htmlFor="include-ak-integrasi"
                    className="cursor-pointer"
                  >
                    Sertakan AK Integrasi
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-ak-pendidikan"
                    checked={includeAkPendidikan}
                    onCheckedChange={(checked) =>
                      setIncludeAkPendidikan(checked === true)
                    }
                  />
                  <Label
                    htmlFor="include-ak-pendidikan"
                    className="cursor-pointer"
                  >
                    Sertakan AK Pendidikan
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCetakMultiDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleGenerateMultiPDF}
              disabled={selectedPeriodIds.length === 0 || isGenerating}
            >
              {isGenerating
                ? "Membuat PDF..."
                : `Generate PDF (${selectedPeriodIds.length} halaman)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
