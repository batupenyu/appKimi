import { useMemo } from 'react';
import { Users, Calculator, Building2, TrendingUp, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePegawaiStorage, useAngkaIntegrasiStorage, useInstansiStorage } from '@/hooks/useStorage';

export function Dashboard() {
  const { pegawai } = usePegawaiStorage();
  const { angkaIntegrasi } = useAngkaIntegrasiStorage();
  const { instansi } = useInstansiStorage();

  const stats = useMemo(() => {
    const totalPegawai = pegawai.length;
    const totalAngkaIntegrasi = angkaIntegrasi.length;
    const totalInstansi = instansi.length;

    const lakiLaki = pegawai.filter(p => p.jenis_kelamin === 'Laki-laki').length;
    const perempuan = pegawai.filter(p => p.jenis_kelamin === 'Perempuan').length;

    const avgAngkaIntegrasi = totalAngkaIntegrasi > 0
      ? (angkaIntegrasi.reduce((sum, ai) => sum + ai.value, 0) / totalAngkaIntegrasi).toFixed(2)
      : '0';

    // Group by jabatan
    const jabatanCounts: Record<string, number> = {};
    pegawai.forEach(p => {
      const jabatan = p.jabatan || 'Tidak ada jabatan';
      jabatanCounts[jabatan] = (jabatanCounts[jabatan] || 0) + 1;
    });

    const jabatanList = Object.entries(jabatanCounts)
      .sort((a, b) => b[1] - a[1]); // Sort by count descending

    return {
      totalPegawai,
      totalAngkaIntegrasi,
      totalInstansi,
      lakiLaki,
      perempuan,
      avgAngkaIntegrasi,
      jabatanList,
    };
  }, [pegawai, angkaIntegrasi, instansi]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan data kepegawaian
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPegawai}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lakiLaki} Laki-laki, {stats.perempuan} Perempuan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Angka Integrasi</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAngkaIntegrasi}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata: {stats.avgAngkaIntegrasi}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instansi</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInstansi}</div>
            <p className="text-xs text-muted-foreground">
              Unit organisasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rasio Kelamin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPegawai > 0 
                ? `${((stats.lakiLaki / stats.totalPegawai) * 100).toFixed(0)}%` 
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Pegawai laki-laki
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jabatan Summary */}
      {stats.jabatanList.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Ringkasan per Jabatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jabatan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.jabatanList.map(([jabatan, count]) => (
                    <TableRow key={jabatan}>
                      <TableCell className="font-medium">{jabatan}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Sistem Manajemen Kepegawaian</strong> adalah aplikasi untuk mengelola data pegawai,
                angka integrasi, dan instansi.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Kelola data pegawai lengkap dengan informasi pribadi dan kepegawaian</li>
                <li>Import dan export data pegawai menggunakan Excel</li>
                <li>Kelola angka integrasi untuk setiap pegawai</li>
                <li>Kelola data instansi</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Panduan Penggunaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. <strong>Manajemen Pegawai:</strong> Tambah, edit, hapus, dan kelola data pegawai.</p>
              <p>2. <strong>Import Excel:</strong> Gunakan template yang disediakan untuk import data massal.</p>
              <p>3. <strong>Angka Integrasi:</strong> Kelola nilai angka integrasi untuk setiap pegawai.</p>
              <p>4. <strong>Instansi:</strong> Kelola data instansi atau unit organisasi.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
