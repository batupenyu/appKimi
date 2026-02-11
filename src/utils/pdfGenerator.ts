// Define the ReportData type that was previously imported
type ReportData = {
  nomor: string;
  tahun: number;
  namaInstansi: string;
  periodeAwal: string;
  periodeAkhir: string;
  pegawai: {
    nama: string;
    nip: string;
    noSeriKarpeg: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: string;
    pangkat: string;
    golongan: string;
    tmtPangkat: string;
    unitKerja: string;
  };
  jabatanDanTmt: string;
  includeAngkaIntegrasi: boolean;
  angkaIntegrasiValue: number;
  includeAkPendidikan: boolean;
  akPendidikanValue: number;
  akList: Array<{
    penilaian: string;
    prosentase: number;
    koefisien: number;
    jumlahAngkaKredit: number;
  }>;
  totalAngkaKredit: number;
  tempatDitetapkan: string;
  tanggalDitetapkan: string;
  penilai: {
    nama: string;
    pangkat: string;
    golongan: string;
    nip: string;
  };
  nextRank?: string;
  nextJenjang?: string;
  sisaAngkaKredit?: number;
};

/**
 * Generates a PDF using Puppeteer
 * @param reportData - The report data to convert to PDF
 * @returns Promise<string> - The PDF file path
 */
export async function generatePDFWithPuppeteer(
  reportData: ReportData,
  reportElement?: HTMLElement | null,
): Promise<void> {
  try {
    // Small delay to ensure DOM is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Use the passed element or find it in the DOM
    let element = reportElement;
    
    if (!element) {
      element = document.getElementById("report-content");
    }
    
    if (!element) {
      throw new Error("Report belum selesai dimuat. Silakan tunggu sebentar dan coba lagi.");
    }

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Copy all stylesheets to ensure proper rendering
    const styleSheets = Array.from(document.styleSheets);
    let cssText = '';
    
    styleSheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach((rule) => {
          cssText += rule.cssText + '\n';
        });
      } catch (e) {
        // Skip stylesheets we can't access (CORS)
        console.warn('Could not access stylesheet:', sheet.href);
      }
    });
    
    // Create a wrapper for proper styling
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = "190mm"; // A4 width (210mm) minus margins (10mm each side)
    wrapper.style.maxWidth = "190mm";
    wrapper.style.padding = "0";
    wrapper.style.boxSizing = "border-box";
    wrapper.style.backgroundColor = "white";
    wrapper.style.fontFamily = "Arial, sans-serif";
    wrapper.style.fontSize = "11pt";
    wrapper.style.color = "black";
    wrapper.style.overflow = "hidden";
    
    // Add the CSS as a style element with additional overflow prevention
    const additionalCSS = `
      * {
        box-sizing: border-box;
      }
      table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: fixed !important;
        word-wrap: break-word !important;
      }
      td, th {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
      }
      .report-content {
        width: 100% !important;
        max-width: 190mm !important;
        overflow: hidden !important;
      }
    `;
    
    if (cssText || additionalCSS) {
      const styleElement = document.createElement('style');
      styleElement.textContent = (cssText || '') + additionalCSS;
      wrapper.appendChild(styleElement);
    }
    
    wrapper.appendChild(clonedElement);

    document.body.appendChild(wrapper);

    // Wait for fonts and styles to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Dynamically import html2pdf
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default;

    const options = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `konversi-angka-kredit-${reportData.nomor}.pdf`,
      image: { type: "jpeg" as const, quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait" as const,
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['tr', 'td', 'th']
      },
    };

    console.log("Starting PDF generation...");
    
    // Generate PDF with timeout
    const pdfPromise = html2pdf().set(options).from(wrapper).save();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("PDF generation timeout - taking too long")), 30000)
    );
    
    await Promise.race([pdfPromise, timeoutPromise]);
    
    console.log("PDF generation completed");

    // Clean up
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  } catch (error) {
    console.error("Error generating PDF with html2pdf method:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Show the actual error to the user for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a timeout error
    if (errorMessage.includes("timeout")) {
      alert(`PDF generation timed out. This might be due to:\n- Complex content that takes too long to render\n- Network issues loading resources\n\nSilakan coba lagi.`);
      
      // Clean up
      const wrappers = document.querySelectorAll("body > div[style*='-9999px']");
      wrappers.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      return; // Don't try jsPDF fallback for timeout
    }
    
    alert(`Terjadi kesalahan saat membuat PDF: ${errorMessage}\n\nMencoba metode alternatif...`);

    // Clean up any remaining temporary elements
    const wrappers = document.querySelectorAll("body > div[style*='-9999px']");
    wrappers.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    // Try the jsPDF method as a secondary fallback
    try {
      console.log("Falling back to jsPDF method...");
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();

      // Title
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0); // Ensure text is visible
      doc.text("KONVERSI KE ANGKA KREDIT", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(
        `NOMOR : 800/ ${reportData.nomor} /.........../Dindik/ ${reportData.tahun}/PAK`,
        105,
        30,
        { align: "center" },
      );

      // Header info
      doc.setFontSize(11);
      doc.text(`Instansi: ${reportData.namaInstansi}`, 15, 40);
      doc.text(
        `Periode : ${reportData.periodeAwal} s.d. ${reportData.periodeAkhir}`,
        150,
        40,
      );

      // Personal Information Table
      autoTable(doc, {
        startY: 50,
        head: [["I.", "KETERANGAN PERORANGAN"]],
        body: [
          ["1.", "Nama", ":", reportData.pegawai.nama],
          ["2.", "NIP", ":", reportData.pegawai.nip],
          ["3.", "No. Seri Karpeg", ":", reportData.pegawai.noSeriKarpeg],
          [
            "4.",
            "Tempat Tgl. Lahir",
            ":",
            `${reportData.pegawai.tempatLahir}, ${reportData.pegawai.tanggalLahir}`,
          ],
          ["5.", "Jenis Kelamin", ":", reportData.pegawai.jenisKelamin],
          [
            "6.",
            "Pangkat/Gol.Ruang/Gol/TMT",
            ":",
            `${reportData.pegawai.pangkat}, ${reportData.pegawai.golongan}, ${reportData.pegawai.tmtPangkat}`,
          ],
          ["7.", "Jabatan /TMT", ":", reportData.jabatanDanTmt],
          ["8.", "Unit Kerja", ":", reportData.pegawai.unitKerja],
          ["9.", "Instansi", ":", reportData.namaInstansi],
        ],
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        styles: { cellPadding: 4, fontSize: 10, textColor: [0, 0, 0] }, // Ensure text is visible
        columnStyles: {
          0: { cellWidth: 15, halign: "center" }, // Number column
          1: { cellWidth: 60 }, // Label column
          2: { cellWidth: 10, halign: "center" }, // Colon column
          3: { cellWidth: 105 }, // Value column
        },
        margin: { left: 15 },
      });

      // Credit Table
      const creditTableData = [];

      // Add headers
      creditTableData.push([
        "HASIL PENILAIAN KINERJA",
        "PROSENTASE",
        "KOEFISIEN PER TAHUN",
        "ANGKA KREDIT YANG DI DAPAT",
      ]);
      creditTableData.push(["PREDIKAT", "PROSENTASE", "", ""]);

      // Add AK Integrasi if included
      if (
        reportData.includeAngkaIntegrasi &&
        reportData.angkaIntegrasiValue > 0
      ) {
        creditTableData.push([
          "AK Integrasi",
          ".",
          ".",
          (Math.round(reportData.angkaIntegrasiValue * 100) / 100).toString(),
        ]);
      }

      // Add AK Pendidikan if included
      if (reportData.includeAkPendidikan && reportData.akPendidikanValue > 0) {
        creditTableData.push([
          "AK Pendidikan",
          ".",
          ".",
          (Math.round(reportData.akPendidikanValue * 100) / 100).toString(),
        ]);
      }

      // Add AK List items
      reportData.akList.forEach((akItem: any) => {
        creditTableData.push([
          akItem.penilaian,
          `${akItem.prosentase}%`,
          akItem.koefisien,
          (Math.round(akItem.jumlahAngkaKredit * 100) / 100).toString(),
        ]);
      });

      // Add total row
      creditTableData.push([
        "Jumlah Angka Kredit",
        "",
        "",
        (Math.round(reportData.totalAngkaKredit * 100) / 100).toString(),
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["KONVERSI KE ANGKA KREDIT"]],
        body: creditTableData,
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        styles: { cellPadding: 4, fontSize: 10, textColor: [0, 0, 0] }, // Ensure text is visible
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 50, halign: "right" },
        },
        margin: { left: 15 },
        didParseCell: function (data) {
          if (data.row.index === 0) {
            // Header row
            data.cell.styles.fontStyle = "bold";
          }
          if (data.row.index === 1) {
            // Sub-header row
            data.cell.styles.fontStyle = "bold";
          }
          if (data.row.index === creditTableData.length - 1) {
            // Total row
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`ASLI disampaikan dengan hormat kepada:`, 15, finalY + 10);
      doc.text(`Jabatan Fungsional yang bersangkutan.`, 15, finalY + 15);

      doc.text(`Tembusan disampaikan kepada:`, 15, finalY + 25);
      doc.text(`1. Jabatan Fungsional yang bersangkutan`, 15, finalY + 30);
      doc.text(`2. Ketua/atasan unit kerja`, 15, finalY + 35);
      doc.text(`3. Kepala Biro Kepegawaian dan Organisasi`, 15, finalY + 40);
      doc.text(`4. Pejabat lain yang diangkap perlu.`, 15, finalY + 45);

      // Signature block
      doc.text(
        `Ditetapkan di ${reportData.tempatDitetapkan}`,
        120,
        finalY + 10,
      );
      doc.text(
        `Pada tanggal, ${reportData.tanggalDitetapkan}.`,
        120,
        finalY + 15,
      );
      doc.text(`Pejabat Penilai Kinerja`, 120, finalY + 30);
      doc.text(`${reportData.penilai.nama}`, 120, finalY + 50);
      doc.text(
        `${reportData.penilai.pangkat}, ${reportData.penilai.golongan}`,
        120,
        finalY + 55,
      );
      doc.text(`NIP. ${reportData.penilai.nip}`, 120, finalY + 60);

      // Save the PDF
      doc.save(`konversi-angka-kredit-${reportData.nomor}.pdf`);
    } catch (jsPdfError) {
      console.error("Error generating PDF with jsPDF:", jsPdfError);
      alert(
        "Terjadi kesalahan saat membuat PDF. Silakan hubungi administrator.",
      );
    }
  }
}

// This function is kept as a fallback for the jsPDF method below
function generateHTMLFromReportData(reportData: ReportData): string {
  return `
    <div id="report-content">
      <!-- Judul & Nomor: CENTER -->
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-weight: bold; margin-bottom: 4px;">KONVERSI KE ANGKA KREDIT</div>
        <div style="font-weight: bold; font-size: 11pt;">
          NOMOR : 800/ ${reportData.nomor} /.........../Dindik/ ${reportData.tahun}/PAK
        </div>
      </div>

      <!-- Instansi & Periode -->
      <table style="width: 100%; border: none; font-size: 11pt; margin-bottom: 16px;">
        <tbody>
          <tr>
            <td>Instansi: ${reportData.namaInstansi}</td>
            <td style="text-align: right;">
              Periode : ${reportData.periodeAwal} s.d. ${reportData.periodeAkhir}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Tabel Keterangan Perorangan -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr>
            <th style="width: 5%; border: 1px solid black; border-bottom: 2px solid black; padding: 4px 6px; text-align: center; vertical-align: middle; font-weight: bold;">I.</th>
            <th colspan="3" style="width: 95%; text-align: left; border: 1px solid black; border-bottom: 2px solid black; padding: 4px 6px; text-align: center; vertical-align: middle; font-weight: bold;">
              KETERANGAN PERORANGAN
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">1.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">Nama</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.pegawai.nama}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">2.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">NIP</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.pegawai.nip}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">3.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">No. Seri Karpeg</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.pegawai.noSeriKarpeg}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">4.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">Tempat Tgl. Lahir</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.pegawai.tempatLahir}, ${reportData.pegawai.tanggalLahir}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">5.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">Jenis Kelamin</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.pegawai.jenisKelamin}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">6.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">Pangkat/Gol.Ruang/Gol/TMT</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.pegawai.pangkat}, ${reportData.pegawai.golongan}, ${reportData.pegawai.tmtPangkat}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">7.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">Jabatan /TMT</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.jabatanDanTmt}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">8.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">Unit Kerja</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.pegawai.unitKerja}</td>
          </tr>
          <tr style="vertical-align: middle;">
            <td style="width: 5%; text-align: center; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px;">9.</td>
            <td style="width: 30%; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">Instansi</td>
            <td style="width: 30px; text-align: center; padding: 4px 2px; border-left: none; border-right: none; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">:</td>
            <td style="width: 63%; border-left: none; border-right: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 6px; vertical-align: middle;">${reportData.namaInstansi}</td>
          </tr>
        </tbody>
      </table>

      <!-- Tabel Angka Kredit -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; table-layout: fixed;">
        <thead>
          <tr>
            <td colspan="4" style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">KONVERSI KE ANGKA KREDIT</td>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">HASIL PENILAIAN KINERJA</td>
            <td rowspan="2" style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">
              KOEFISIEN <br />
              PER TAHUN
            </td>
            <td rowspan="2" style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">
              ANGKA KREDIT <br />
              YANG DI DAPAT
            </td>
          </tr>
          <tr>
            <th style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word; font-weight: bold;">PREDIKAT</th>
            <th style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word; font-weight: bold;">PROSENTASE</th>
          </tr>
        </thead>
        <tbody>
          ${
            reportData.includeAngkaIntegrasi &&
            reportData.angkaIntegrasiValue > 0
              ? `<tr>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">AK Integrasi</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">.</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">.</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">${(Math.round(reportData.angkaIntegrasiValue * 100) / 100)}</td>
            </tr>`
              : ""
          }
          ${
            reportData.includeAkPendidikan && reportData.akPendidikanValue > 0
              ? `<tr>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">AK Pendidikan</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">.</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">.</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">${(Math.round(reportData.akPendidikanValue * 100) / 100)}</td>
            </tr>`
              : ""
          }
          ${reportData.akList
            .map(
              (akItem: any) =>
                `<tr>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">${akItem.penilaian}</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">${akItem.prosentase}%</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">${akItem.koefisien}</td>
              <td style="border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">${(Math.round(akItem.jumlahAngkaKredit * 100) / 100)}</td>
            </tr>`,
            )
            .join("")}
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold; border: 1px solid black; padding: 4px 6px; vertical-align: middle; word-wrap: break-word; padding-right: 8px;">
              Jumlah Angka Kredit
            </td>
            <td style="font-weight: bold; border: 1px solid black; padding: 4px 6px; vertical-align: middle; text-align: center; word-wrap: break-word;">${(Math.round(reportData.totalAngkaKredit * 100) / 100)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Footer -->
      <table style="width: 100%; border: none; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="width: 60%; vertical-align: top;">
              <p style="margin: 0 0 8px 0;">
                <strong>ASLI disampaikan dengan hormat kepada:</strong>
                <br />
                Jabatan Fungsional yang bersangkutan.
              </p>
              <p style="margin: 0; margin: 0 0 8px 0;">
                <strong>Tembusan disampaikan kepada:</strong>
                <br />
                1. Jabatan Fungsional yang bersangkutan
                <br />
                2. Ketua/atasan unit kerja
                <br />
                3. Kepala Biro Kepegawaian dan Organisasi
                <br />
                4. Pejabat lain yang diangkap perlu.
              </p>
            </td>
            <td style="width: 40%; vertical-align: top;">
              <div style="text-align: left;">
                <div>Ditetapkan di ${reportData.tempatDitetapkan}</div>
                <div>Pada tanggal, ${reportData.tanggalDitetapkan}.</div>
                <div style="margin-top: 10px;">
                  Pejabat Penilai Kinerja
                </div>
                <div style="margin-top: 40px;">
                  ${reportData.penilai.nama}
                  <br />
                  ${reportData.penilai.pangkat}, ${reportData.penilai.golongan}
                  <br />
                  NIP. ${reportData.penilai.nip}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
