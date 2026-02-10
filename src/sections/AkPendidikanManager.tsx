import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
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
import { useAkPendidikanStorage, usePegawaiStorage } from "@/hooks/useStorage";
import { JENJANG_PENDIDIKAN_OPTIONS, calculateAkPendidikan } from "@/constants";
import type { AkPendidikan } from "@/types";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

interface AkPendidikanFormData {
  pegawaiId: string;
  nama_pendidikan: string;
  jenjang: string;
  tahun_lulus: number;
  nilai_next_pangkat: number;
}

const INITIAL_FORM_DATA: AkPendidikanFormData = {
  pegawaiId: "",
  nama_pendidikan: "",
  jenjang: "",
  tahun_lulus: new Date().getFullYear(),
  nilai_next_pangkat: 0,
};

export function AkPendidikanManager() {
  const {
    akPendidikan,
    addAkPendidikan,
    updateAkPendidikan,
    deleteAkPendidikan,
    getAkPendidikanByPegawai,
  } = useAkPendidikanStorage();
  const { pegawai } = usePegawaiStorage();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAkPendidikan, setSelectedAkPendidikan] =
    useState<AkPendidikan | null>(null);
  const [formData, setFormData] =
    useState<AkPendidikanFormData>(INITIAL_FORM_DATA);

  // Pegawai lookup maps
  const pegawaiMap = useMemo(() => {
    const map = new Map();
    pegawai.forEach((p) => map.set(p.id, p));
    return map;
  }, [pegawai]);

  // Calculate AK Pendidikan value based on selected jenjang
  const calculatedValue = useMemo(() => {
    if (formData.jenjang && formData.tahun_lulus) {
      return calculateAkPendidikan(formData.jenjang, formData.tahun_lulus);
    }
    return 0;
  }, [formData.jenjang, formData.tahun_lulus]);

  // Filter and paginate
  const filteredData = useMemo(() => {
    if (!searchQuery) return akPendidikan;
    const query = searchQuery.toLowerCase();
    return akPendidikan.filter(
      (item) =>
        pegawaiMap.get(item.pegawaiId)?.nama?.toLowerCase().includes(query) ||
        item.nama_pendidikan.toLowerCase().includes(query) ||
        item.jenjang.toLowerCase().includes(query),
    );
  }, [akPendidikan, searchQuery, pegawaiMap]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleJenjangChange = (jenjang: string) => {
    const option = JENJANG_PENDIDIKAN_OPTIONS.find(
      (opt) => opt.value === jenjang,
    );
    const nilai = option?.nilai || 0;
    setFormData({
      ...formData,
      jenjang,
      nilai_next_pangkat: nilai,
    });
  };

  const handleAdd = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: AkPendidikan) => {
    setSelectedAkPendidikan(item);
    setFormData({
      pegawaiId: item.pegawaiId,
      nama_pendidikan: item.nama_pendidikan,
      jenjang: item.jenjang,
      tahun_lulus: item.tahun_lulus,
      nilai_next_pangkat: item.nilai_next_pangkat,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: AkPendidikan) => {
    setSelectedAkPendidikan(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmAdd = () => {
    if (!formData.pegawaiId) {
      toast.error("Pilih pegawai terlebih dahulu");
      return;
    }
    if (!formData.nama_pendidikan) {
      toast.error("Nama pendidikan tidak boleh kosong");
      return;
    }
    if (!formData.jenjang) {
      toast.error("Pilih jenjang pendidikan");
      return;
    }

    addAkPendidikan({
      pegawaiId: formData.pegawaiId,
      nama_pendidikan: formData.nama_pendidikan,
      jenjang: formData.jenjang,
      tahun_lulus: formData.tahun_lulus,
      nilai_next_pangkat: formData.nilai_next_pangkat,
      calculated_value: calculatedValue,
    });

    toast.success("AK Pendidikan berhasil ditambahkan");
    setIsAddDialogOpen(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const confirmDelete = () => {
    if (!selectedAkPendidikan) return;
    deleteAkPendidikan(selectedAkPendidikan.id);
    toast.success("AK Pendidikan berhasil dihapus");
    setIsDeleteDialogOpen(false);
    setSelectedAkPendidikan(null);
  };

  const confirmEdit = () => {
    if (!selectedAkPendidikan) return;
    if (!formData.pegawaiId) {
      toast.error("Pilih pegawai terlebih dahulu");
      return;
    }
    if (!formData.nama_pendidikan) {
      toast.error("Nama pendidikan tidak boleh kosong");
      return;
    }
    if (!formData.jenjang) {
      toast.error("Pilih jenjang pendidikan");
      return;
    }

    updateAkPendidikan(selectedAkPendidikan.id, {
      pegawaiId: formData.pegawaiId,
      nama_pendidikan: formData.nama_pendidikan,
      jenjang: formData.jenjang,
      tahun_lulus: formData.tahun_lulus,
      nilai_next_pangkat: formData.nilai_next_pangkat,
      calculated_value: calculatedValue,
    });

    toast.success("AK Pendidikan berhasil diperbarui");
    setIsEditDialogOpen(false);
    setSelectedAkPendidikan(null);
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

      {/* Nama Pendidikan */}
      <div className="space-y-2">
        <Label htmlFor="nama_pendidikan">Nama Pendidikan *</Label>
        <Input
          id="nama_pendidikan"
          value={formData.nama_pendidikan}
          onChange={(e) =>
            setFormData({ ...formData, nama_pendidikan: e.target.value })
          }
          placeholder="Masukkan nama pendidikan"
        />
      </div>

      {/* Jenjang Pendidikan */}
      <div className="space-y-2">
        <Label htmlFor="jenjang">Jenjang Pendidikan *</Label>
        <Select value={formData.jenjang} onValueChange={handleJenjangChange}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenjang" />
          </SelectTrigger>
          <SelectContent>
            {JENJANG_PENDIDIKAN_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} (Nilai Next Pangkat: {option.nilai})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tahun Lulus */}
      <div className="space-y-2">
        <Label htmlFor="tahun_lulus">Tahun Lulus *</Label>
        <Input
          id="tahun_lulus"
          type="number"
          value={formData.tahun_lulus}
          onChange={(e) =>
            setFormData({
              ...formData,
              tahun_lulus: parseInt(e.target.value) || new Date().getFullYear(),
            })
          }
          placeholder="Masukkan tahun lulus"
          min={1900}
          max={new Date().getFullYear()}
        />
      </div>

      {/* Calculated Value Display */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground mb-1">
          Nilai Next Pangkat: {formData.nilai_next_pangkat}
        </div>
        <div className="text-lg font-semibold">
          AK Pendidikan (25% × {formData.nilai_next_pangkat}) ={" "}
          {calculatedValue.toFixed(2)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AK Pendidikan</h1>
          <p className="text-muted-foreground">
            Kelola angka kredit pendidikan untuk setiap pegawai
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah AK Pendidikan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total AK Pendidikan
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {akPendidikan
                .reduce((sum, item) => sum + item.calculated_value, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{akPendidikan.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(akPendidikan.map((item) => item.pegawaiId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama pegawai, pendidikan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Pegawai</TableHead>
              <TableHead>Nama Pendidikan</TableHead>
              <TableHead>Jenjang</TableHead>
              <TableHead>Tahun Lulus</TableHead>
              <TableHead>Nilai Next Pangkat</TableHead>
              <TableHead>AK Pendidikan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Tidak ada data yang cocok"
                        : "Belum ada data AK Pendidikan"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {pegawaiMap.get(item.pegawaiId)?.nama || "-"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {pegawaiMap.get(item.pegawaiId)?.nip || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{item.nama_pendidikan}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.jenjang}</Badge>
                  </TableCell>
                  <TableCell>{item.tahun_lulus}</TableCell>
                  <TableCell>{item.nilai_next_pangkat}</TableCell>
                  <TableCell className="font-medium">
                    {item.calculated_value.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah AK Pendidikan</DialogTitle>
            <DialogDescription>
              Tambahkan data angka kredit pendidikan baru
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit AK Pendidikan</DialogTitle>
            <DialogDescription>
              Perbarui data angka kredit pendidikan
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
            <Button onClick={confirmEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus AK Pendidikan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data ini?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedAkPendidikan && (
              <div className="space-y-2">
                <p>
                  <strong>Pegawai:</strong>{" "}
                  {pegawaiMap.get(selectedAkPendidikan.pegawaiId)?.nama || "-"}
                </p>
                <p>
                  <strong>Pendidikan:</strong>{" "}
                  {selectedAkPendidikan.nama_pendidikan}
                </p>
                <p>
                  <strong>Jenjang:</strong> {selectedAkPendidikan.jenjang}
                </p>
                <p>
                  <strong>AK Pendidikan:</strong>{" "}
                  {selectedAkPendidikan.calculated_value.toFixed(2)}
                </p>
              </div>
            )}
          </div>
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
    </div>
  );
}
