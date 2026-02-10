import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAngkaIntegrasiStorage, usePegawaiStorage } from '@/hooks/useStorage';
import type { AngkaIntegrasi } from '@/types';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

interface AngkaIntegrasiFormData {
  pegawaiId: string;
  value: string;
}

const INITIAL_FORM_DATA: AngkaIntegrasiFormData = {
  pegawaiId: '',
  value: '',
};

export function AngkaIntegrasiManager() {
  const { angkaIntegrasi, addAngkaIntegrasi, updateAngkaIntegrasi, deleteAngkaIntegrasi } = useAngkaIntegrasiStorage();
  const { pegawai } = usePegawaiStorage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAngkaIntegrasi, setSelectedAngkaIntegrasi] = useState<AngkaIntegrasi | null>(null);
  const [formData, setFormData] = useState<AngkaIntegrasiFormData>(INITIAL_FORM_DATA);

  // Create a map of pegawai for quick lookup
  const pegawaiMap = useMemo(() => {
    const map = new Map();
    pegawai.forEach(p => map.set(p.id, p));
    return map;
  }, [pegawai]);

  // Enrich angka integrasi with pegawai data
  const enrichedAngkaIntegrasi = useMemo(() => {
    return angkaIntegrasi.map(ai => ({
      ...ai,
      pegawaiNama: pegawaiMap.get(ai.pegawaiId)?.nama || ai.pegawaiNama || '-',
      pegawaiNip: pegawaiMap.get(ai.pegawaiId)?.nip || ai.pegawaiNip || '-',
    }));
  }, [angkaIntegrasi, pegawaiMap]);

  // Filter and paginate
  const filteredData = useMemo(() => {
    if (!searchQuery) return enrichedAngkaIntegrasi;
    const query = searchQuery.toLowerCase();
    return enrichedAngkaIntegrasi.filter(item => 
      item.pegawaiNama.toLowerCase().includes(query) ||
      item.pegawaiNip.toLowerCase().includes(query)
    );
  }, [enrichedAngkaIntegrasi, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAdd = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: AngkaIntegrasi) => {
    setSelectedAngkaIntegrasi(item);
    setFormData({
      pegawaiId: item.pegawaiId,
      value: String(item.value),
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: AngkaIntegrasi) => {
    setSelectedAngkaIntegrasi(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmAdd = () => {
    if (!formData.pegawaiId) {
      toast.error('Pilih pegawai terlebih dahulu');
      return;
    }
    if (!formData.value || isNaN(Number(formData.value))) {
      toast.error('Nilai angka integrasi harus berupa angka');
      return;
    }

    const selectedPegawai = pegawaiMap.get(formData.pegawaiId);
    addAngkaIntegrasi({
      pegawaiId: formData.pegawaiId,
      pegawaiNama: selectedPegawai?.nama || '-',
      pegawaiNip: selectedPegawai?.nip || '-',
      value: Number(formData.value),
    });
    toast.success('Angka integrasi berhasil ditambahkan');
    setIsAddDialogOpen(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const confirmEdit = () => {
    if (!selectedAngkaIntegrasi) return;
    if (!formData.pegawaiId) {
      toast.error('Pilih pegawai terlebih dahulu');
      return;
    }
    if (!formData.value || isNaN(Number(formData.value))) {
      toast.error('Nilai angka integrasi harus berupa angka');
      return;
    }

    const selectedPegawai = pegawaiMap.get(formData.pegawaiId);
    updateAngkaIntegrasi(selectedAngkaIntegrasi.id, {
      pegawaiId: formData.pegawaiId,
      pegawaiNama: selectedPegawai?.nama || '-',
      pegawaiNip: selectedPegawai?.nip || '-',
      value: Number(formData.value),
    });
    toast.success('Angka integrasi berhasil diperbarui');
    setIsEditDialogOpen(false);
    setSelectedAngkaIntegrasi(null);
  };

  const confirmDelete = () => {
    if (!selectedAngkaIntegrasi) return;
    deleteAngkaIntegrasi(selectedAngkaIntegrasi.id);
    toast.success('Angka integrasi berhasil dihapus');
    setIsDeleteDialogOpen(false);
    setSelectedAngkaIntegrasi(null);
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pegawai">Pegawai *</Label>
        <Select
          value={formData.pegawaiId}
          onValueChange={(value) => setFormData({ ...formData, pegawaiId: value })}
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
      <div className="space-y-2">
        <Label htmlFor="value">Nilai Angka Integrasi *</Label>
        <Input
          id="value"
          type="number"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder="Masukkan nilai angka integrasi"
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
              <Calculator className="h-6 w-6" />
              Manajemen Angka Integrasi
            </CardTitle>
          </div>
          <Button onClick={handleAdd} disabled={pegawai.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Angka Integrasi
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau NIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              Total: {angkaIntegrasi.length} data
            </Badge>
          </div>

          {pegawai.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                Belum ada data pegawai. Silakan tambah pegawai terlebih dahulu.
              </p>
            </div>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nilai Angka Integrasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'Tidak ada data yang sesuai' : 'Belum ada data angka integrasi'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                      <TableCell className="font-medium">{item.pegawaiNama}</TableCell>
                      <TableCell>{item.pegawaiNip}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="font-mono text-lg">
                          {item.value}
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Angka Integrasi</DialogTitle>
            <DialogDescription>
              Pilih pegawai dan masukkan nilai angka integrasi.
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
            <DialogTitle>Edit Angka Integrasi</DialogTitle>
            <DialogDescription>
              Perbarui data angka integrasi.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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
            <DialogTitle>Hapus Angka Integrasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus angka integrasi untuk pegawai{' '}
              <strong>{selectedAngkaIntegrasi?.pegawaiNama}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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
