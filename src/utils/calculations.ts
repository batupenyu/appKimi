// Constants for AK Requirements based on Permenpan RB 1/2023 (simplified)
// Mapping from current Golongan to the REQUIRED AK to reach the NEXT level.

// Full mapping covering I/a to IV/e
export const AK_TARGET_MAP: Record<
  string,
  { required: number; nextGolongan: string; nextJenjang?: string }
> = {
  // Group I (Juru)
  "I/a": { required: 15, nextGolongan: "I/b" },
  "I/b": { required: 15, nextGolongan: "I/c" },
  "I/c": { required: 15, nextGolongan: "I/d" },
  "I/d": { required: 15, nextGolongan: "II/a", nextJenjang: "Pengatur Muda" },

  // Group II (Pengatur) - Keterampilan Pemula/Terampil
  "II/a": { required: 20, nextGolongan: "II/b" },
  "II/b": { required: 20, nextGolongan: "II/c", nextJenjang: "Terampil" },
  "II/c": { required: 20, nextGolongan: "II/d" },
  "II/d": { required: 20, nextGolongan: "III/a", nextJenjang: "Mahir" },

  // Group III (Penata) - Keterampilan Mahir / Keahlian Pertama
  "III/a": { required: 50, nextGolongan: "III/b" },
  "III/b": { required: 50, nextGolongan: "III/c", nextJenjang: "Ahli Muda" }, // or Penyelia if Keterampilan
  "III/c": { required: 100, nextGolongan: "III/d" },
  "III/d": { required: 100, nextGolongan: "IV/a", nextJenjang: "Ahli Madya" },

  // Group IV (Pembina) - Keahlian Madya / Utama
  "IV/a": { required: 150, nextGolongan: "IV/b" },
  "IV/b": { required: 150, nextGolongan: "IV/c" },
  "IV/c": { required: 150, nextGolongan: "IV/d", nextJenjang: "Ahli Utama" },
  "IV/d": { required: 200, nextGolongan: "IV/e" },
  "IV/e": { required: 0, nextGolongan: "" },
};

// Minimal AK mapping for penatapan PDF
// Format: (pangkat_saat_ini, pangkat_tujuan) -> (minimal_pangkat, minimal_jenjang)
// Jenjang value of null means not available (-)
export const MINIMAL_AK_MAPPING: Record<string, [number, number | null]> = {
  "III/a|III/b": [50, 100],
  "III/b|III/c": [100, 100],
  "III/c|III/d": [100, 200],
  "III/d|IV/a": [200, 200],
  "IV/a|IV/b": [150, 450],
  "IV/b|IV/c": [300, 450],
  "IV/c|IV/d": [450, 450],
  "IV/d|IV/e": [200, null], // Jenjang tidak tersedia (-)
};

export const PANGKAT_NAMES: Record<string, string> = {
  "I/a": "Juru Muda",
  "I/b": "Juru Muda Tk. I",
  "I/c": "Juru",
  "I/d": "Juru Tk. I",
  "II/a": "Pengatur Muda",
  "II/b": "Pengatur Muda Tk. I",
  "II/c": "Pengatur",
  "II/d": "Pengatur Tk. I",
  "III/a": "Penata Muda",
  "III/b": "Penata Muda Tk. I",
  "III/c": "Penata",
  "III/d": "Penata Tk. I",
  "IV/a": "Pembina",
  "IV/b": "Pembina Tk. I",
  "IV/c": "Pembina Utama Muda",
  "IV/d": "Pembina Utama Madya",
  "IV/e": "Pembina Utama",
};

// Base values for jenjang pendidikan (used as fallback when golongongan is not available)
export const JENJANG_PENDIDIKAN_BASE_VALUES: Record<string, number> = {
  sd: 1,
  smp: 2,
  sma: 3,
  d1: 15,
  d2: 20,
  d3: 25,
  d4s1: 30,
  s2: 50,
  s3: 100,
};

interface CalculationResult {
  pangkatMinimal: number;
  jenjangMinimal: number | null;
  hasilPangkat: number; // deficit/surplus
  hasilJenjang: number; // deficit/surplus
  teksTujuan: string;
}

export function calculateTargetAK(
  currentGolongan: string,
  currentTotalAK: number,
): CalculationResult {
  const normalizedGolongan = (currentGolongan || "").trim();
  const target = AK_TARGET_MAP[normalizedGolongan];

  if (!target) {
    return {
      pangkatMinimal: 0,
      jenjangMinimal: 0,
      hasilPangkat: 0,
      hasilJenjang: 0,
      teksTujuan: "Jabatan ......",
    };
  }

  // Check if there's a custom minimal AK mapping for this transition
  const mappingKey = `${normalizedGolongan}|${target.nextGolongan}`;
  const customMapping = MINIMAL_AK_MAPPING[mappingKey];

  let pangkatMinimal: number;
  let jenjangMinimal: number;

  if (customMapping) {
    // Use custom mapping values
    pangkatMinimal = customMapping[0];
    jenjangMinimal = customMapping[1] !== null ? customMapping[1] : 0;
  } else {
    // Use default values from AK_TARGET_MAP
    pangkatMinimal = target.required;
    jenjangMinimal = target.nextJenjang ? target.required : 0;
  }

  const hasilPangkat = currentTotalAK - pangkatMinimal;
  const hasilJenjang =
    target.nextJenjang || customMapping?.[1] !== null
      ? currentTotalAK - jenjangMinimal
      : 0;

  // Construct destination text
  const nextPangkatName =
    PANGKAT_NAMES[target.nextGolongan] || target.nextGolongan;
  const tujuan = target.nextJenjang
    ? `${target.nextJenjang} / ${nextPangkatName} (${target.nextGolongan})`
    : `${nextPangkatName} (${target.nextGolongan})`;

  return {
    pangkatMinimal,
    jenjangMinimal,
    hasilPangkat,
    hasilJenjang,
    teksTujuan: tujuan || "Jabatan ......",
  };
}

// Function to calculate AK Pendidikan
// Formula: 25% × Jenjang Minimal (based on current golongongan's next jenjang requirement from MINIMAL_AK_MAPPING)
// If golongongan is provided, uses MINIMAL_AK_MAPPING to get jenjang minimal
// If golongongan is not provided, uses baseValue from jenjang (fallback)
export const calculateAkPendidikan = (
  jenjang: string,
  tahunLulus: number,
  golongongan?: string,
): number => {
  // If golongongan is provided, use jenjang minimal from MINIMAL_AK_MAPPING
  if (golongongan) {
    const target = AK_TARGET_MAP[golongongan];
    if (target) {
      const mappingKey = `${golongongan}|${target.nextGolongan}`;
      const customMapping = MINIMAL_AK_MAPPING[mappingKey];

      if (customMapping && customMapping[1] !== null) {
        // Use jenjang minimal (25% × jenjang minimal)
        return customMapping[1] * 0.25;
      }
    }
  }

  // Fallback: use baseValue × 0.25
  const baseValue = JENJANG_PENDIDIKAN_BASE_VALUES[jenjang] || 0;
  return baseValue * 0.25;
};
