import { useState, useEffect, useCallback } from "react";
import type {
  Pegawai,
  AngkaIntegrasi,
  Instansi,
  PenilaianAngkaKredit,
  AkPendidikan,
} from "@/types";

// Storage keys
const STORAGE_KEYS = {
  PEGAWAI: "appkimi_pegawai",
  ANGKA_INTEGRASI: "appkimi_angka_integrasi",
  INSTANSI: "appkimi_instansi",
  PENILAIAN_AK: "appkimi_penilaian_ak",
  AK_PENDIDIKAN: "appkimi_ak_pendidikan",
};

// Helper functions for localStorage
function getFromStorage<T>(key: string): T[] {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T extends { id: string }>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Hook for Pegawai
export function usePegawaiStorage() {
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = getFromStorage<Pegawai>(STORAGE_KEYS.PEGAWAI);
    setPegawai(data);
    setLoading(false);
  }, []);

  const addPegawai = useCallback(
    async (data: Omit<Pegawai, "id" | "createdAt" | "updatedAt">) => {
      const newPegawai: Pegawai = {
        ...data,
        golongan: data.golongan || "", // Initialize new field if not provided
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...pegawai, newPegawai];
      setPegawai(updated);
      saveToStorage(STORAGE_KEYS.PEGAWAI, updated);
      return newPegawai;
    },
    [pegawai],
  );

  const updatePegawai = useCallback(
    async (id: string, data: Partial<Pegawai>) => {
      const updated = pegawai.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              golongan: data.golongan ?? p.golongan,
              updatedAt: new Date().toISOString(),
            }
          : p,
      );
      setPegawai(updated);
      saveToStorage(STORAGE_KEYS.PEGAWAI, updated);
      return updated.find((p) => p.id === id) || null;
    },
    [pegawai],
  );

  const deletePegawai = useCallback(
    async (id: string) => {
      const updated = pegawai.filter((p) => p.id !== id);
      setPegawai(updated);
      saveToStorage(STORAGE_KEYS.PEGAWAI, updated);
    },
    [pegawai],
  );

  const getPegawaiById = useCallback(
    (id: string) => {
      return pegawai.find((p) => p.id === id);
    },
    [pegawai],
  );

  const importPegawai = useCallback(
    async (data: Omit<Pegawai, "id" | "createdAt" | "updatedAt">[]) => {
      const newPegawai: Pegawai[] = data.map((item) => ({
        ...item,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const updated = [...pegawai, ...newPegawai];
      setPegawai(updated);
      saveToStorage(STORAGE_KEYS.PEGAWAI, updated);
      return newPegawai;
    },
    [pegawai],
  );

  const clearAllPegawai = useCallback(async () => {
    setPegawai([]);
    localStorage.removeItem(STORAGE_KEYS.PEGAWAI);
  }, []);

  return {
    pegawai,
    loading,
    addPegawai,
    updatePegawai,
    deletePegawai,
    getPegawaiById,
    importPegawai,
    clearAllPegawai,
  };
}

// Hook for Angka Integrasi
export function useAngkaIntegrasiStorage() {
  const [angkaIntegrasi, setAngkaIntegrasi] = useState<AngkaIntegrasi[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = getFromStorage<AngkaIntegrasi>(STORAGE_KEYS.ANGKA_INTEGRASI);
    setAngkaIntegrasi(data);
    setLoading(false);
  }, []);

  const addAngkaIntegrasi = useCallback(
    async (data: Omit<AngkaIntegrasi, "id" | "createdAt" | "updatedAt">) => {
      const newItem: AngkaIntegrasi = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...angkaIntegrasi, newItem];
      setAngkaIntegrasi(updated);
      saveToStorage(STORAGE_KEYS.ANGKA_INTEGRASI, updated);
      return newItem;
    },
    [angkaIntegrasi],
  );

  const updateAngkaIntegrasi = useCallback(
    async (id: string, data: Partial<AngkaIntegrasi>) => {
      const updated = angkaIntegrasi.map((ai) =>
        ai.id === id
          ? { ...ai, ...data, updatedAt: new Date().toISOString() }
          : ai,
      );
      setAngkaIntegrasi(updated);
      saveToStorage(STORAGE_KEYS.ANGKA_INTEGRASI, updated);
      return updated.find((ai) => ai.id === id) || null;
    },
    [angkaIntegrasi],
  );

  const deleteAngkaIntegrasi = useCallback(
    async (id: string) => {
      const updated = angkaIntegrasi.filter((ai) => ai.id !== id);
      setAngkaIntegrasi(updated);
      saveToStorage(STORAGE_KEYS.ANGKA_INTEGRASI, updated);
    },
    [angkaIntegrasi],
  );

  const getAngkaIntegrasiById = useCallback(
    (id: string) => {
      return angkaIntegrasi.find((ai) => ai.id === id);
    },
    [angkaIntegrasi],
  );

  const getAngkaIntegrasiByPegawai = useCallback(
    (pegawaiId: string) => {
      return angkaIntegrasi.filter((ai) => ai.pegawaiId === pegawaiId);
    },
    [angkaIntegrasi],
  );

  return {
    angkaIntegrasi,
    loading,
    addAngkaIntegrasi,
    updateAngkaIntegrasi,
    deleteAngkaIntegrasi,
    getAngkaIntegrasiById,
    getAngkaIntegrasiByPegawai,
  };
}

// Hook for Instansi
export function useInstansiStorage() {
  const [instansi, setInstansi] = useState<Instansi[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = getFromStorage<Instansi>(STORAGE_KEYS.INSTANSI);
    setInstansi(data);
    setLoading(false);
  }, []);

  const addInstansi = useCallback(
    async (data: Omit<Instansi, "id" | "createdAt" | "updatedAt">) => {
      const newItem: Instansi = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...instansi, newItem];
      setInstansi(updated);
      saveToStorage(STORAGE_KEYS.INSTANSI, updated);
      return newItem;
    },
    [instansi],
  );

  const updateInstansi = useCallback(
    async (id: string, data: Partial<Instansi>) => {
      const updated = instansi.map((i) =>
        i.id === id
          ? { ...i, ...data, updatedAt: new Date().toISOString() }
          : i,
      );
      setInstansi(updated);
      saveToStorage(STORAGE_KEYS.INSTANSI, updated);
      return updated.find((i) => i.id === id) || null;
    },
    [instansi],
  );

  const deleteInstansi = useCallback(
    async (id: string) => {
      const updated = instansi.filter((i) => i.id !== id);
      setInstansi(updated);
      saveToStorage(STORAGE_KEYS.INSTANSI, updated);
    },
    [instansi],
  );

  const getInstansiById = useCallback(
    (id: string) => {
      return instansi.find((i) => i.id === id);
    },
    [instansi],
  );

  return {
    instansi,
    loading,
    addInstansi,
    updateInstansi,
    deleteInstansi,
    getInstansiById,
  };
}

// Hook for Penilaian Angka Kredit
export function usePenilaianAngkaKreditStorage() {
  const [penilaianAK, setPenilaianAK] = useState<PenilaianAngkaKredit[]>([]);
  const [loading, setLoading] = useState(true);

  // Migration function to convert old predicate values to new ones
  const migratePredicateValues = useCallback(
    (data: PenilaianAngkaKredit[]): PenilaianAngkaKredit[] => {
      const predicateMapping: Record<string, string> = {
        baik_sekali: "sangat_baik",
        baik: "baik",
        cukup: "butuh_perbaikan",
        kurang: "kurang",
        buruk: "sangat_kurang",
      };

      return data.map((item) => {
        if (predicateMapping[item.predikat]) {
          return {
            ...item,
            predikat: predicateMapping[item.predikat] as any,
          };
        }
        return item;
      });
    },
    [],
  );

  // Load data from localStorage on mount
  useEffect(() => {
    const data = getFromStorage<PenilaianAngkaKredit>(
      STORAGE_KEYS.PENILAIAN_AK,
    );
    const migratedData = migratePredicateValues(data);
    setPenilaianAK(migratedData);
    saveToStorage(STORAGE_KEYS.PENILAIAN_AK, migratedData); // Save migrated data back
    setLoading(false);
  }, [migratePredicateValues]);

  const addPenilaianAK = useCallback(
    async (
      data: Omit<PenilaianAngkaKredit, "id" | "createdAt" | "updatedAt">,
    ) => {
      const newItem: PenilaianAngkaKredit = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...penilaianAK, newItem];
      setPenilaianAK(updated);
      saveToStorage(STORAGE_KEYS.PENILAIAN_AK, updated);
      return newItem;
    },
    [penilaianAK],
  );

  const updatePenilaianAK = useCallback(
    async (id: string, data: Partial<PenilaianAngkaKredit>) => {
      const updated = penilaianAK.map((p) =>
        p.id === id
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p,
      );
      setPenilaianAK(updated);
      saveToStorage(STORAGE_KEYS.PENILAIAN_AK, updated);
      return updated.find((p) => p.id === id) || null;
    },
    [penilaianAK],
  );

  const deletePenilaianAK = useCallback(
    async (id: string) => {
      const updated = penilaianAK.filter((p) => p.id !== id);
      setPenilaianAK(updated);
      saveToStorage(STORAGE_KEYS.PENILAIAN_AK, updated);
    },
    [penilaianAK],
  );

  const getPenilaianAKById = useCallback(
    (id: string) => {
      return penilaianAK.find((p) => p.id === id);
    },
    [penilaianAK],
  );

  const getPenilaianAKByPegawai = useCallback(
    (pegawaiId: string) => {
      return penilaianAK.filter((p) => p.pegawaiId === pegawaiId);
    },
    [penilaianAK],
  );

  return {
    penilaianAK,
    loading,
    addPenilaianAK,
    updatePenilaianAK,
    deletePenilaianAK,
    getPenilaianAKById,
    getPenilaianAKByPegawai,
  };
}

// Hook for Ak Pendidikan
export function useAkPendidikanStorage() {
  const [akPendidikan, setAkPendidikan] = useState<AkPendidikan[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = getFromStorage<AkPendidikan>(STORAGE_KEYS.AK_PENDIDIKAN);
    setAkPendidikan(data);
    setLoading(false);
  }, []);

  const addAkPendidikan = useCallback(
    async (data: Omit<AkPendidikan, "id" | "createdAt" | "updatedAt">) => {
      const newItem: AkPendidikan = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...akPendidikan, newItem];
      setAkPendidikan(updated);
      saveToStorage(STORAGE_KEYS.AK_PENDIDIKAN, updated);
      return newItem;
    },
    [akPendidikan],
  );

  const updateAkPendidikan = useCallback(
    async (id: string, data: Partial<AkPendidikan>) => {
      const updated = akPendidikan.map((ap) =>
        ap.id === id
          ? { ...ap, ...data, updatedAt: new Date().toISOString() }
          : ap,
      );
      setAkPendidikan(updated);
      saveToStorage(STORAGE_KEYS.AK_PENDIDIKAN, updated);
      return updated.find((ap) => ap.id === id) || null;
    },
    [akPendidikan],
  );

  const deleteAkPendidikan = useCallback(
    async (id: string) => {
      const updated = akPendidikan.filter((ap) => ap.id !== id);
      setAkPendidikan(updated);
      saveToStorage(STORAGE_KEYS.AK_PENDIDIKAN, updated);
    },
    [akPendidikan],
  );

  const getAkPendidikanById = useCallback(
    (id: string) => {
      return akPendidikan.find((ap) => ap.id === id);
    },
    [akPendidikan],
  );

  const getAkPendidikanByPegawai = useCallback(
    (pegawaiId: string) => {
      return akPendidikan.filter((ap) => ap.pegawaiId === pegawaiId);
    },
    [akPendidikan],
  );

  const getTotalAkPendidikanByPegawai = useCallback(
    (pegawaiId: string) => {
      const items = akPendidikan.filter((ap) => ap.pegawaiId === pegawaiId);
      // Sum up all calculated values (recalculated to avoid floating-point issues)
      return items.reduce((sum, item) => sum + Math.ceil(item.nilai_next_pangkat * 0.25 * 4) / 4, 0);
    },
    [akPendidikan],
  );

  return {
    akPendidikan,
    loading,
    addAkPendidikan,
    updateAkPendidikan,
    deleteAkPendidikan,
    getAkPendidikanById,
    getAkPendidikanByPegawai,
    getTotalAkPendidikanByPegawai,
  };
}
