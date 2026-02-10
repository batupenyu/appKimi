import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  FileDown,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePegawaiStorage } from "@/hooks/useStorage";
import {
  downloadExcelTemplate,
  exportPegawaiToExcel,
  parseExcelFile,
  validateExcelFile,
} from "@/utils/excel";
import type { Pegawai, PegawaiFormData } from "@/types";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 5;

const golongan_OPTIONS = [
  "I/a",
  "I/b",
  "I/c",
  "I/d",
  "II/a",
  "II/b",
  "II/c",
  "II/d",
  "III/a",
  "III/b",
  "III/c",
  "III/d",
  "IV/a",
  "IV/b",
  "IV/c",
  "IV/d",
  "IV/e",
];

const PANGKAT_OPTIONS = [
  "Juru Muda",
  "Juru Muda Tk. I",
  "Juru",
  "Juru Tk. I",
  "Pengatur Muda",
  "Pengatur Muda Tk. I",
  "Pengatur",
  "Pengatur Tk. I",
  "Penata Muda",
  "Penata Muda Tk. I",
  "Penata",
  "Penata Tk. I",
  "Pembina",
  "Pembina Tk. I",
  "Pembina Utama Muda",
  "Pembina Utama Madya",
  "Pembina Utama",
];


const INITIAL_FORM_DATA: PegawaiFormData = {
  nama: "",
  nip: "",
  no_seri_karpeg: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  jenis_kelamin: "Laki-laki" as "Laki-laki" | "Perempuan",
  pangkat: "",
  golongan: "",
  tmt_pangkat: "",
  tmt_jabatan: "",
  jabatan: "",
  unit_kerja: "",
};

export function PegawaiManager() {
  const { pegawai, addPegawai, updatePegawai, deletePegawai, importPegawai } =
    usePegawaiStorage();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null);
  const [formData, setFormData] = useState<PegawaiFormData>(INITIAL_FORM_DATA);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Filter and paginate pegawai
  const filteredPegawai = useMemo(() => {
    if (!searchQuery) return pegawai;
    const query = searchQuery.toLowerCase();
    return pegawai.filter(
      (p) =>
        p.nama.toLowerCase().includes(query) ||
        p.nip.toLowerCase().includes(query) ||
        p.jabatan.toLowerCase().includes(query) ||
        p.unit_kerja.toLowerCase().includes(query),
    );
  }, [pegawai, searchQuery]);

  const totalPages = Math.ceil(filteredPegawai.length / ITEMS_PER_PAGE);
  const paginatedPegawai = filteredPegawai.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleAdd = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (pegawai: Pegawai) => {
    setSelectedPegawai(pegawai);
    setFormData({
      nama: pegawai.nama,
      nip: pegawai.nip,
      no_seri_karpeg: pegawai.no_seri_karpeg,
      tempat_lahir: pegawai.tempat_lahir,
      tanggal_lahir: pegawai.tanggal_lahir,
      jenis_kelamin: pegawai.jenis_kelamin,
      pangkat: pegawai.pangkat,
      golongan: pegawai.golongan || "",
      tmt_pangkat: pegawai.tmt_pangkat,
      tmt_jabatan: pegawai.tmt_jabatan,
      jabatan: pegawai.jabatan,
      unit_kerja: pegawai.unit_kerja,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (pegawai: Pegawai) => {
    setSelectedPegawai(pegawai);
    setIsDeleteDialogOpen(true);
  };

  const confirmAdd = () => {
    if (!formData.nama || !formData.nip) {
      toast.error("Nama dan NIP wajib diisi");
      return;
    }
    addPegawai(formData);
    toast.success("Pegawai berhasil ditambahkan");
    setIsAddDialogOpen(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const confirmEdit = () => {
    if (!selectedPegawai) return;
    if (!formData.nama || !formData.nip) {
      toast.error("Nama dan NIP wajib diisi");
      return;
    }
    updatePegawai(selectedPegawai.id, formData);
    toast.success("Pegawai berhasil diperbarui");
    setIsEditDialogOpen(false);
    setSelectedPegawai(null);
  };

  const confirmDelete = () => {
    if (!selectedPegawai) return;
    deletePegawai(selectedPegawai.id);
    toast.success("Pegawai berhasil dihapus");
    setIsDeleteDialogOpen(false);
    setSelectedPegawai(null);
  };

  const handleExport = () => {
    if (pegawai.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    exportPegawaiToExcel(pegawai);
    toast.success("Data berhasil diekspor");
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
    toast.success("Template berhasil diunduh");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateExcelFile(file)) {
        toast.error("File harus berformat .xlsx atau .xls");
        return;
      }
      setImportFile(file);
    }
  };

  const confirmImport = async () => {
    if (!importFile) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }

    setIsImporting(true);
    try {
      const data = await parseExcelFile(importFile);
      if (data.length === 0) {
        toast.error("Tidak ada data yang dapat diimpor");
        return;
      }
      importPegawai(data);
      toast.success(`${data.length} data pegawai berhasil diimpor`);
      setIsImportDialogOpen(false);
      setImportFile(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const renderForm = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="nama">Nama *</Label>
        <Input
          id="nama"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          placeholder="Masukkan nama"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nip">NIP *</Label>
        <Input
          id="nip"
          value={formData.nip}
          onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
          placeholder="Masukkan NIP"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="no_seri_karpeg">No. Seri Karpeg</Label>
        <Input
          id="no_seri_karpeg"
          value={formData.no_seri_karpeg}
          onChange={(e) =>
            setFormData({ ...formData, no_seri_karpeg: e.target.value })
          }
          placeholder="Masukkan no. seri karpeg"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
        <Input
          id="tempat_lahir"
          value={formData.tempat_lahir}
          onChange={(e) =>
            setFormData({ ...formData, tempat_lahir: e.target.value })
          }
          placeholder="Masukkan tempat lahir"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
        <Input
          id="tanggal_lahir"
          type="date"
          value={formData.tanggal_lahir}
          onChange={(e) =>
            setFormData({ ...formData, tanggal_lahir: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
        <Select
          value={formData.jenis_kelamin}
          onValueChange={(value: "Laki-laki" | "Perempuan") =>
            setFormData({ ...formData, jenis_kelamin: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis kelamin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
            <SelectItem value="Perempuan">Perempuan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pangkat">Pangkat</Label>
        <Select
          value={formData.pangkat}
          onValueChange={(value) =>
            setFormData({ ...formData, pangkat: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih pangkat" />
          </SelectTrigger>
          <SelectContent>
            {PANGKAT_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="golongan">Golongan</Label>
        <Select
          value={formData.golongan}
          onValueChange={(value) =>
            setFormData({ ...formData, golongan: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih golongan" />
          </SelectTrigger>
          <SelectContent>
            {golongan_OPTIONS.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tmt_pangkat">TMT Pangkat</Label>
        <Input
          id="tmt_pangkat"
          type="date"
          value={formData.tmt_pangkat}
          onChange={(e) =>
            setFormData({ ...formData, tmt_pangkat: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tmt_jabatan">TMT Jabatan</Label>
        <Input
          id="tmt_jabatan"
          type="date"
          value={formData.tmt_jabatan}
          onChange={(e) =>
            setFormData({ ...formData, tmt_jabatan: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jabatan">Jabatan</Label>
        <Input
          id="jabatan"
          value={formData.jabatan}
          onChange={(e) =>
            setFormData({ ...formData, jabatan: e.target.value })
          }
          placeholder="Masukkan jabatan"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit_kerja">Unit Kerja</Label>
        <Input
          id="unit_kerja"
          value={formData.unit_kerja}
          onChange={(e) =>
            setFormData({ ...formData, unit_kerja: e.target.value })
          }
          placeholder="Masukkan unit kerja"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6" />
              Manajemen Pegawai
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <FileDown className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pegawai
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">Total: {pegawai.length} pegawai</Badge>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Pangkat/Gol</TableHead>
                  <TableHead>Golongan</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPegawai.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery
                        ? "Tidak ada pegawai yang sesuai"
                        : "Belum ada data pegawai"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPegawai.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.nama}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.nip}
                        </div>
                      </TableCell>
                      <TableCell>{item.nip}</TableCell>
                      <TableCell>
                        {item.pangkat && item.golongan
                          ? `${item.pangkat} (${item.golongan})`
                          : "-"}
                      </TableCell>
                      <TableCell>{item.golongan || "-"}</TableCell>
                      <TableCell>{item.jabatan}</TableCell>
                      <TableCell>{item.unit_kerja}</TableCell>
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
            <DialogTitle>Tambah Pegawai</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk menambahkan data pegawai.
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
            <DialogTitle>Edit Pegawai</DialogTitle>
            <DialogDescription>
              Perbarui data pegawai berikut.
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
            <DialogTitle>Hapus Pegawai</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedPegawai?.nama}?
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data Pegawai</DialogTitle>
            <DialogDescription>
              Import data pegawai dari file Excel. Pastikan format file sesuai
              dengan template yang disediakan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Pilih File Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Download template terlebih dahulu untuk memastikan format yang
              benar.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={confirmImport} disabled={isImporting}>
              {isImporting ? "Mengimpor..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
