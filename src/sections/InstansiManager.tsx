import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInstansiStorage } from '@/hooks/useStorage';
import type { Instansi } from '@/types';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

interface InstansiFormData {
  name: string;
}

const INITIAL_FORM_DATA: InstansiFormData = {
  name: '',
};

export function InstansiManager() {
  const { instansi, addInstansi, updateInstansi, deleteInstansi } = useInstansiStorage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInstansi, setSelectedInstansi] = useState<Instansi | null>(null);
  const [formData, setFormData] = useState<InstansiFormData>(INITIAL_FORM_DATA);

  // Filter and paginate
  const filteredData = useMemo(() => {
    if (!searchQuery) return instansi;
    const query = searchQuery.toLowerCase();
    return instansi.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }, [instansi, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAdd = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: Instansi) => {
    setSelectedInstansi(item);
    setFormData({
      name: item.name,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: Instansi) => {
    setSelectedInstansi(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmAdd = () => {
    if (!formData.name.trim()) {
      toast.error('Nama instansi wajib diisi');
      return;
    }

    // Check for duplicate names
    const exists = instansi.some(i => 
      i.name.toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (exists) {
      toast.error('Instansi dengan nama tersebut sudah ada');
      return;
    }

    addInstansi({
      name: formData.name.trim(),
    });
    toast.success('Instansi berhasil ditambahkan');
    setIsAddDialogOpen(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const confirmEdit = () => {
    if (!selectedInstansi) return;
    if (!formData.name.trim()) {
      toast.error('Nama instansi wajib diisi');
      return;
    }

    // Check for duplicate names (excluding current item)
    const exists = instansi.some(i => 
      i.id !== selectedInstansi.id &&
      i.name.toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (exists) {
      toast.error('Instansi dengan nama tersebut sudah ada');
      return;
    }

    updateInstansi(selectedInstansi.id, {
      name: formData.name.trim(),
    });
    toast.success('Instansi berhasil diperbarui');
    setIsEditDialogOpen(false);
    setSelectedInstansi(null);
  };

  const confirmDelete = () => {
    if (!selectedInstansi) return;
    deleteInstansi(selectedInstansi.id);
    toast.success('Instansi berhasil dihapus');
    setIsDeleteDialogOpen(false);
    setSelectedInstansi(null);
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Instansi *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Masukkan nama instansi"
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
              <Building2 className="h-6 w-6" />
              Manajemen Instansi
            </CardTitle>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Instansi
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              Total: {instansi.length} instansi
            </Badge>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Instansi</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'Tidak ada instansi yang sesuai' : 'Belum ada data instansi'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
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
            <DialogTitle>Tambah Instansi Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama instansi.
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
            <DialogTitle>Edit Instansi</DialogTitle>
            <DialogDescription>
              Perbarui nama instansi.
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
            <DialogTitle>Hapus Instansi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus instansi{' '}
              <strong>{selectedInstansi?.name}</strong>?
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
