import * as XLSX from "xlsx";
import type { Pegawai } from "@/types";
import type { ExcelTemplateRow } from "@/constants";

// Template headers for Excel
export const EXCEL_TEMPLATE_HEADERS = [
  "nama",
  "nip",
  "no_seri_karpeg",
  "tempat_lahir",
  "tanggal_lahir",
  "jenis_kelamin",
  "pangkat",
  "golongan",
  "tmt_pangkat",
  "tmt_jabatan",
  "jabatan",
  "unit_kerja",
];

// Empty sample data for template
export const EXCEL_TEMPLATE_SAMPLE: ExcelTemplateRow[] = [];

// Download Excel Template
export function downloadExcelTemplate(): void {
  const ws = XLSX.utils.json_to_sheet([], { header: EXCEL_TEMPLATE_HEADERS });

  // Add sample row (empty since no dummy data)
  XLSX.utils.sheet_add_json(ws, EXCEL_TEMPLATE_SAMPLE, {
    header: EXCEL_TEMPLATE_HEADERS,
    skipHeader: true,
    origin: 1,
  });

  // Set column widths
  const colWidths = [
    { wch: 30 }, // nama
    { wch: 20 }, // nip
    { wch: 15 }, // no_seri_karpeg
    { wch: 20 }, // tempat_lahir
    { wch: 15 }, // tanggal_lahir
    { wch: 12 }, // jenis_kelamin
    { wch: 20 }, // pangkat
    { wch: 10 }, // golongan
    { wch: 15 }, // tmt_pangkat
    { wch: 15 }, // tmt_jabatan
    { wch: 25 }, // jabatan
    { wch: 30 }, // unit_kerja
  ];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template Pegawai");
  XLSX.writeFile(wb, "Template_Import_Pegawai.xlsx");
}

// Export Pegawai to Excel
export function exportPegawaiToExcel(
  pegawai: Pegawai[],
  filename?: string,
): void {
  const exportData = pegawai.map((p) => ({
    nama: p.nama,
    nip: p.nip,
    no_seri_karpeg: p.no_seri_karpeg,
    tempat_lahir: p.tempat_lahir,
    tanggal_lahir: p.tanggal_lahir,
    jenis_kelamin: p.jenis_kelamin,
    pangkat: p.pangkat,
    golongan: p.golongan,
    tmt_pangkat: p.tmt_pangkat,
    tmt_jabatan: p.tmt_jabatan,
    jabatan: p.jabatan,
    unit_kerja: p.unit_kerja,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 30 }, // nama
    { wch: 20 }, // nip
    { wch: 15 }, // no_seri_karpeg
    { wch: 20 }, // tempat_lahir
    { wch: 15 }, // tanggal_lahir
    { wch: 12 }, // jenis_kelamin
    { wch: 20 }, // pangkat
    { wch: 10 }, // golongan
    { wch: 15 }, // tmt_pangkat
    { wch: 15 }, // tmt_jabatan
    { wch: 25 }, // jabatan
    { wch: 30 }, // unit_kerja
  ];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Pegawai");

  const defaultFilename = `Data_Pegawai_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename || defaultFilename);
}

// Parse Excel file to Pegawai data
export function parseExcelFile(
  file: File,
): Promise<Omit<Pegawai, "id" | "createdAt" | "updatedAt">[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
        }) as string[][];

        if (jsonData.length < 2) {
          reject(new Error("File Excel kosong atau tidak memiliki data"));
          return;
        }

        // Get headers from first row
        const headers = jsonData[0].map((h) => String(h).toLowerCase().trim());

        // Validate required headers
        const requiredHeaders = ["nama", "nip"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h),
        );

        if (missingHeaders.length > 0) {
          reject(
            new Error(
              `Header yang diperlukan tidak ditemukan: ${missingHeaders.join(", ")}`,
            ),
          );
          return;
        }

        // Parse data rows
        const pegawaiData: Omit<Pegawai, "id" | "createdAt" | "updatedAt">[] =
          [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length === 0 || !row[0]) continue; // Skip empty rows

          const getValue = (header: string): string => {
            const index = headers.indexOf(header);
            return index >= 0 ? String(row[index] || "").trim() : "";
          };

          const jenisKelamin = getValue("jenis_kelamin");

          const golonganValue = getValue("golongan");

          pegawaiData.push({
            nama: getValue("nama"),
            nip: getValue("nip"),
            no_seri_karpeg: getValue("no_seri_karpeg"),
            tempat_lahir: getValue("tempat_lahir"),
            tanggal_lahir: getValue("tanggal_lahir"),
            jenis_kelamin:
              jenisKelamin === "Laki-laki" || jenisKelamin === "Perempuan"
                ? jenisKelamin
                : "Laki-laki",
            pangkat: getValue("pangkat"),
            golongan: golonganValue,
            tmt_pangkat: getValue("tmt_pangkat"),
            tmt_jabatan: getValue("tmt_jabatan"),
            jabatan: getValue("jabatan"),
            unit_kerja: getValue("unit_kerja"),
          });
        }

        resolve(pegawaiData);
      } catch (error) {
        reject(
          new Error("Gagal memparse file Excel: " + (error as Error).message),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Validate Excel file
export function validateExcelFile(file: File): boolean {
  const validExtensions = [".xlsx", ".xls"];
  const fileName = file.name.toLowerCase();
  return validExtensions.some((ext) => fileName.endsWith(ext));
}
