import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db"; // Import the database client

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins during development
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", true);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Template cache
let akumulasiTemplate = null;

async function loadTemplate() {
  if (akumulasiTemplate) return akumulasiTemplate;

  const templatePath = path.join(__dirname, "../akumulasi.html");
  akumulasiTemplate = await fs.readFile(templatePath, "utf-8");
  return akumulasiTemplate;
}

// Render HTML to PDF using Puppeteer
async function renderPDF(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    // Wait for any fonts to load
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// Replace template variables
function replaceTemplateVars(template, data) {
  let result = template;

  // Handle conditionals {% if ... %}
  result = result.replace(/\{% if (\w+) %\}/g, (match, varName) => {
    return data[varName] ? "" : "";
  });

  // Handle {% endif %}
  result = result.replace(/\{% endif %\}/g, "");

  // Handle loops {% for ... %}
  const forRegex = /\{% for (\w+) in (\w+) %\}([\s\S]*?)\{% endfor %\}/g;
  result = result.replace(forRegex, (match, itemName, listName, inner) => {
    const list = data[listName] || [];
    return list
      .map((item) => {
        let innerResult = inner;
        // Replace {{ item.property }}
        innerResult = innerResult.replace(
          new RegExp(`\\{\\{ ${itemName}\\.(\\w+)\\}\\}`, "g"),
          (m, prop) => {
            return item[prop] !== undefined ? item[prop] : "";
          },
        );
        return innerResult;
      })
      .join("");
  });

  // Handle simple variables {{ var.property }}
  result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, prop) => {
    return data[obj]?.[prop] !== undefined ? data[obj][prop] : "";
  });

  // Handle simple variables {{ var }}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return data[varName] !== undefined ? data[varName] : "";
  });

  // Handle date filter {{ var|date:"format" }}
  result = result.replace(
    /\{\{(\w+)\|date:"([^"]+)"\}\}/g,
    (match, varName, format) => {
      const date = data[varName];
      if (!date) return "-";
      const d = new Date(date);
      if (format === "d-m-Y") {
        return d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    },
  );

  // Handle float format {{ var|floatformat:"2" }}
  result = result.replace(
    /\{\{(\w+)\|floatformat:"([^"]+)"\}\}/g,
    (match, varName, decimals) => {
      const num = parseFloat(data[varName]);
      if (isNaN(num)) return "0.00";
      const decimalPlaces = parseInt(decimals);
      return (Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)).toFixed(decimalPlaces);
    },
  );

  return result;
}

// API endpoint for generating Akumulasi PDF
app.post("/api/akumulasi/pdf", async (req, res) => {
  try {
    const {
      selectedPegawai,
      selectedInstansi,
      selectedPenilai,
      tahun,
      sortedPenilaian,
      akPendidikanValue,
      angkaIntegrasiValue,
      grandTotal,
      totalAngkaKredit,
      includeAkPendidikan,
      includeAngkaIntegrasi,
    } = req.body;

    // Load template
    const template = await loadTemplate();

    // Build ak_list for the template
    const akList = [];

    // Add AK Integrasi row
    if (includeAngkaIntegrasi && angkaIntegrasiValue > 0) {
      akList.push({
        penilaian: "AK Integrasi",
        prosentase: ".",
        koefisien: ".",
        jumlah_angka_kredit: angkaIntegrasiValue,
      });
    }

    // Add AK Pendidikan row
    if (includeAkPendidikan && akPendidikanValue > 0) {
      akList.push({
        penilaian: "AK Pendidikan",
        prosentase: ".",
        koefisien: ".",
        jumlah_angka_kredit: akPendidikanValue,
      });
    }

    // Add penilaian rows
    sortedPenilaian.forEach((item) => {
      akList.push({
        penilaian: item.predikat || "-",
        prosentase: `${item.prosentase || 0}%`,
        koefisien: item.koefisien != null ? (Math.round(item.koefisien * 100) / 100).toString() : "-",
        jumlah_angka_kredit: item.angkaKredit != null ? (Math.round(item.angkaKredit * 100) / 100) : 0,
      });
    });

    // Prepare report data
    const reportData = {
      tahun,
      nama_instansi: selectedInstansi?.name || "-",
      periode_awal_str: `01-01-${tahun}`,
      periode_akhir_str: `31-12-${tahun}`,
      include_angka_integrasi: includeAngkaIntegrasi,
      angka_integrasi_value: angkaIntegrasiValue || 0,
      include_ak_pendidikan: includeAkPendidikan,
      ak_pendidikan_value: akPendidikanValue || 0,
      ak_list: akList,
      total_angka_kredit: grandTotal,
      jab: selectedPegawai?.jabatan || "-",
      nama_pegawai: selectedPegawai?.nama || "-",
      nip_pegawai: selectedPegawai?.nip || "-",
      golongan: selectedPegawai?.golongan || "-",
      pangkat: selectedPegawai?.pangkat || "-",
      unit_kerja: selectedPegawai?.unit_kerja || "-",
    };

    // Replace template variables
    const html = replaceTemplateVars(template, reportData);

    // Generate PDF
    const pdfBuffer = await renderPDF(html);

    // Send response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="akumulasi_${selectedPegawai?.nama || "export"}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// API endpoints for Pegawai
app.get("/api/pegawai", async (req, res) => {
  try {
    const pegawai = await db.pegawai.findMany();
    res.json(pegawai);
  } catch (error) {
    console.error("Error fetching pegawai:", error);
    res.status(500).json({ error: "Failed to fetch pegawai" });
  }
});

app.get("/api/pegawai/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pegawai = await db.pegawai.findUnique({
      where: { id },
    });

    if (!pegawai) {
      return res.status(404).json({ error: "Pegawai not found" });
    }

    res.json(pegawai);
  } catch (error) {
    console.error("Error fetching pegawai:", error);
    res.status(500).json({ error: "Failed to fetch pegawai" });
  }
});

app.post("/api/pegawai", async (req, res) => {
  try {
    const pegawai = await db.pegawai.create({
      data: req.body,
    });
    res.json(pegawai);
  } catch (error) {
    console.error("Error creating pegawai:", error);
    res.status(500).json({ error: "Failed to create pegawai" });
  }
});

app.put("/api/pegawai/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pegawai = await db.pegawai.update({
      where: { id },
      data: req.body,
    });
    res.json(pegawai);
  } catch (error) {
    console.error("Error updating pegawai:", error);
    res.status(500).json({ error: "Failed to update pegawai" });
  }
});

app.delete("/api/pegawai/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.pegawai.delete({
      where: { id },
    });
    res.json({ message: "Pegawai deleted successfully" });
  } catch (error) {
    console.error("Error deleting pegawai:", error);
    res.status(500).json({ error: "Failed to delete pegawai" });
  }
});

// API endpoints for Angka Integrasi
app.get("/api/angka-integrasi", async (req, res) => {
  try {
    const angkaIntegrasi = await db.angkaIntegrasi.findMany({
      include: {
        pegawai: true,
      },
    });
    res.json(angkaIntegrasi);
  } catch (error) {
    console.error("Error fetching angka integrasi:", error);
    res.status(500).json({ error: "Failed to fetch angka integrasi" });
  }
});

app.get("/api/angka-integrasi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const angkaIntegrasi = await db.angkaIntegrasi.findUnique({
      where: { id },
      include: {
        pegawai: true,
      },
    });

    if (!angkaIntegrasi) {
      return res.status(404).json({ error: "Angka Integrasi not found" });
    }

    res.json(angkaIntegrasi);
  } catch (error) {
    console.error("Error fetching angka integrasi:", error);
    res.status(500).json({ error: "Failed to fetch angka integrasi" });
  }
});

app.post("/api/angka-integrasi", async (req, res) => {
  try {
    const angkaIntegrasi = await db.angkaIntegrasi.create({
      data: req.body,
    });
    res.json(angkaIntegrasi);
  } catch (error) {
    console.error("Error creating angka integrasi:", error);
    res.status(500).json({ error: "Failed to create angka integrasi" });
  }
});

app.put("/api/angka-integrasi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const angkaIntegrasi = await db.angkaIntegrasi.update({
      where: { id },
      data: req.body,
    });
    res.json(angkaIntegrasi);
  } catch (error) {
    console.error("Error updating angka integrasi:", error);
    res.status(500).json({ error: "Failed to update angka integrasi" });
  }
});

app.delete("/api/angka-integrasi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.angkaIntegrasi.delete({
      where: { id },
    });
    res.json({ message: "Angka Integrasi deleted successfully" });
  } catch (error) {
    console.error("Error deleting angka integrasi:", error);
    res.status(500).json({ error: "Failed to delete angka integrasi" });
  }
});

// API endpoints for Instansi
app.get("/api/instansi", async (req, res) => {
  try {
    const instansi = await db.instansi.findMany();
    res.json(instansi);
  } catch (error) {
    console.error("Error fetching instansi:", error);
    res.status(500).json({ error: "Failed to fetch instansi" });
  }
});

app.get("/api/instansi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const instansi = await db.instansi.findUnique({
      where: { id },
    });

    if (!instansi) {
      return res.status(404).json({ error: "Instansi not found" });
    }

    res.json(instansi);
  } catch (error) {
    console.error("Error fetching instansi:", error);
    res.status(500).json({ error: "Failed to fetch instansi" });
  }
});

app.post("/api/instansi", async (req, res) => {
  try {
    const instansi = await db.instansi.create({
      data: req.body,
    });
    res.json(instansi);
  } catch (error) {
    console.error("Error creating instansi:", error);
    res.status(500).json({ error: "Failed to create instansi" });
  }
});

app.put("/api/instansi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const instansi = await db.instansi.update({
      where: { id },
      data: req.body,
    });
    res.json(instansi);
  } catch (error) {
    console.error("Error updating instansi:", error);
    res.status(500).json({ error: "Failed to update instansi" });
  }
});

app.delete("/api/instansi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.instansi.delete({
      where: { id },
    });
    res.json({ message: "Instansi deleted successfully" });
  } catch (error) {
    console.error("Error deleting instansi:", error);
    res.status(500).json({ error: "Failed to delete instansi" });
  }
});

// API endpoints for Penilaian Angka Kredit
app.get("/api/penilaian-angka-kredit", async (req, res) => {
  try {
    const penilaianAK = await db.penilaianAngkaKredit.findMany({
      include: {
        pegawai: true,
        instansi: true,
      },
    });
    res.json(penilaianAK);
  } catch (error) {
    console.error("Error fetching penilaian angka kredit:", error);
    res.status(500).json({ error: "Failed to fetch penilaian angka kredit" });
  }
});

app.get("/api/penilaian-angka-kredit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const penilaianAK = await db.penilaianAngkaKredit.findUnique({
      where: { id },
      include: {
        pegawai: true,
        instansi: true,
      },
    });

    if (!penilaianAK) {
      return res
        .status(404)
        .json({ error: "Penilaian Angka Kredit not found" });
    }

    res.json(penilaianAK);
  } catch (error) {
    console.error("Error fetching penilaian angka kredit:", error);
    res.status(500).json({ error: "Failed to fetch penilaian angka kredit" });
  }
});

app.post("/api/penilaian-angka-kredit", async (req, res) => {
  try {
    const penilaianAK = await db.penilaianAngkaKredit.create({
      data: req.body,
    });
    res.json(penilaianAK);
  } catch (error) {
    console.error("Error creating penilaian angka kredit:", error);
    res.status(500).json({ error: "Failed to create penilaian angka kredit" });
  }
});

app.put("/api/penilaian-angka-kredit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const penilaianAK = await db.penilaianAngkaKredit.update({
      where: { id },
      data: req.body,
    });
    res.json(penilaianAK);
  } catch (error) {
    console.error("Error updating penilaian angka kredit:", error);
    res.status(500).json({ error: "Failed to update penilaian angka kredit" });
  }
});

app.delete("/api/penilaian-angka-kredit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.penilaianAngkaKredit.delete({
      where: { id },
    });
    res.json({ message: "Penilaian Angka Kredit deleted successfully" });
  } catch (error) {
    console.error("Error deleting penilaian angka kredit:", error);
    res.status(500).json({ error: "Failed to delete penilaian angka kredit" });
  }
});

// API endpoints for AK Pendidikan
app.get("/api/ak-pendidikan", async (req, res) => {
  try {
    const akPendidikan = await db.akPendidikan.findMany({
      include: {
        pegawai: true,
      },
    });
    res.json(akPendidikan);
  } catch (error) {
    console.error("Error fetching ak pendidikan:", error);
    res.status(500).json({ error: "Failed to fetch ak pendidikan" });
  }
});

app.get("/api/ak-pendidikan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const akPendidikan = await db.akPendidikan.findUnique({
      where: { id },
      include: {
        pegawai: true,
      },
    });

    if (!akPendidikan) {
      return res.status(404).json({ error: "AK Pendidikan not found" });
    }

    res.json(akPendidikan);
  } catch (error) {
    console.error("Error fetching ak pendidikan:", error);
    res.status(500).json({ error: "Failed to fetch ak pendidikan" });
  }
});

app.post("/api/ak-pendidikan", async (req, res) => {
  try {
    const akPendidikan = await db.akPendidikan.create({
      data: req.body,
    });
    res.json(akPendidikan);
  } catch (error) {
    console.error("Error creating ak pendidikan:", error);
    res.status(500).json({ error: "Failed to create ak pendidikan" });
  }
});

app.put("/api/ak-pendidikan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const akPendidikan = await db.akPendidikan.update({
      where: { id },
      data: req.body,
    });
    res.json(akPendidikan);
  } catch (error) {
    console.error("Error updating ak pendidikan:", error);
    res.status(500).json({ error: "Failed to update ak pendidikan" });
  }
});

app.delete("/api/ak-pendidikan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.akPendidikan.delete({
      where: { id },
    });
    res.json({ message: "AK Pendidikan deleted successfully" });
  } catch (error) {
    console.error("Error deleting ak pendidikan:", error);
    res.status(500).json({ error: "Failed to delete ak pendidikan" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
