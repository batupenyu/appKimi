// src/services/api.ts
import type { 
  Pegawai, 
  AngkaIntegrasi, 
  Instansi, 
  PenilaianAngkaKredit, 
  AkPendidikan 
} from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Pegawai API functions
export const pegawaiApi = {
  getAll: () => apiCall<Pegawai[]>('/pegawai'),
  getById: (id: string) => apiCall<Pegawai>(`/pegawai/${id}`),
  create: (data: Omit<Pegawai, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiCall<Pegawai>('/pegawai', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pegawai>) => 
    apiCall<Pegawai>(`/pegawai/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => 
    apiCall<void>(`/pegawai/${id}`, { method: 'DELETE' }),
};

// Angka Integrasi API functions
export const angkaIntegrasiApi = {
  getAll: () => apiCall<AngkaIntegrasi[]>('/angka-integrasi'),
  getById: (id: string) => apiCall<AngkaIntegrasi>(`/angka-integrasi/${id}`),
  getByPegawai: (pegawaiId: string) => apiCall<AngkaIntegrasi[]>(`/angka-integrasi?pegawaiId=${pegawaiId}`),
  create: (data: Omit<AngkaIntegrasi, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiCall<AngkaIntegrasi>('/angka-integrasi', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AngkaIntegrasi>) => 
    apiCall<AngkaIntegrasi>(`/angka-integrasi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => 
    apiCall<void>(`/angka-integrasi/${id}`, { method: 'DELETE' }),
};

// Instansi API functions
export const instansiApi = {
  getAll: () => apiCall<Instansi[]>('/instansi'),
  getById: (id: string) => apiCall<Instansi>(`/instansi/${id}`),
  create: (data: Omit<Instansi, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiCall<Instansi>('/instansi', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Instansi>) => 
    apiCall<Instansi>(`/instansi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => 
    apiCall<void>(`/instansi/${id}`, { method: 'DELETE' }),
};

// Penilaian Angka Kredit API functions
export const penilaianAngkaKreditApi = {
  getAll: () => apiCall<PenilaianAngkaKredit[]>('/penilaian-angka-kredit'),
  getById: (id: string) => apiCall<PenilaianAngkaKredit>(`/penilaian-angka-kredit/${id}`),
  getByPegawai: (pegawaiId: string) => apiCall<PenilaianAngkaKredit[]>(`/penilaian-angka-kredit?pegawaiId=${pegawaiId}`),
  create: (data: Omit<PenilaianAngkaKredit, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiCall<PenilaianAngkaKredit>('/penilaian-angka-kredit', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<PenilaianAngkaKredit>) => 
    apiCall<PenilaianAngkaKredit>(`/penilaian-angka-kredit/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => 
    apiCall<void>(`/penilaian-angka-kredit/${id}`, { method: 'DELETE' }),
};

// AK Pendidikan API functions
export const akPendidikanApi = {
  getAll: () => apiCall<AkPendidikan[]>('/ak-pendidikan'),
  getById: (id: string) => apiCall<AkPendidikan>(`/ak-pendidikan/${id}`),
  getByPegawai: (pegawaiId: string) => apiCall<AkPendidikan[]>(`/ak-pendidikan?pegawaiId=${pegawaiId}`),
  create: (data: Omit<AkPendidikan, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiCall<AkPendidikan>('/ak-pendidikan', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AkPendidikan>) => 
    apiCall<AkPendidikan>(`/ak-pendidikan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => 
    apiCall<void>(`/ak-pendidikan/${id}`, { method: 'DELETE' }),
};