import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { deleteSecureToken } from '../utils/secureStorage';
import { getSecureToken } from '../utils/secureStorage';

// Prefer Expo config (`expo.extra.apiBaseUrl`) and trim trailing slashes.
const configBase = String(Constants.expoConfig?.extra?.apiBaseUrl || '').trim();
const fallbackBase = 'http://192.168.1.100:8080';
export const API_BASE = (configBase || fallbackBase).replace(/\/+$/, '');
export const REQUIRE_LIVE_BACKEND = Constants.expoConfig?.extra?.requireLiveBackend !== false;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function normalizeApiError(error: any, fallbackMessage = 'Request failed') {
  const status = error?.response?.status;
  const code = error?.code;
  const message =
    error?.response?.data?.message ||
    (code === 'ECONNABORTED' ? 'Request timeout. Please try again.' : null) ||
    (error?.message?.toLowerCase?.().includes('network') ? 'Network unavailable. Check internet/server connection.' : null) ||
    fallbackMessage;

  return {
    success: false,
    status,
    code,
    message,
    raw: error,
  };
}

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await getSecureToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Hard-expired sessions should be cleared to avoid ghost-auth state.
    if (error?.response?.status === 401) {
      await deleteSecureToken();
      await AsyncStorage.multiRemove(['citizen_data', 'guest_mode']);
    }
    return Promise.reject(error);
  }
);

// ── CITIZEN API CALLS ─────────────────────────────────────────

export const citizenAPI = {

  // POST /citizen/request
  // Submit a new document request
  submitRequest: async (payload: {
    citizen_nid: string;
    citizen_name: string;
    citizen_phone: string;
    document_type: string;
    purpose: string;
    ward_code: string;
    additional_info?: string;
    ocr_raw_data?: string;
  }) => {
    const res = await api.post('/citizen/request', payload);
    return res.data;
  },

  // GET /citizen/request/:requestId
  // Track request status — citizen polls this
  getRequestStatus: async (requestId: string) => {
    const res = await api.get(`/citizen/request/${requestId}`);
    return res.data;
  },

  // GET /citizen/requests (all requests for this citizen)
  getMyRequests: async () => {
    const res = await api.get('/citizen/requests');
    const payload = res.data;
    const incoming = Array.isArray(payload?.requests)
      ? payload.requests
      : Array.isArray(payload)
        ? payload
        : [];

    const requests = incoming
      .filter((r: any) => r?.request_id)
      .map((r: any) => ({
        request_id: String(r.request_id),
        document_type: String(r.document_type || 'UNKNOWN'),
        purpose: String(r.purpose || ''),
        status: String(r.status || 'PENDING'),
        submitted_at: String(r.submitted_at || new Date().toISOString()),
        dtid: r.dtid ? String(r.dtid) : undefined,
        qr_data: r.qr_data ? String(r.qr_data) : undefined,
      }));

    return {
      success: payload?.success !== false,
      requests,
      message: payload?.message,
    };
  },

  // Additional citizen endpoints from backend contract.
  getProfile: async (nid: string) => {
    const res = await api.get(`/citizen/profile/${nid}`);
    return res.data;
  },

  getTaxRecords: async (nid: string) => {
    const res = await api.get(`/citizen/tax/${nid}`);
    return res.data;
  },

  getNotices: async (wardCode: string) => {
    const res = await api.get(`/citizen/notices/${wardCode}`);
    return res.data;
  },

  submitGrievance: async (payload: Record<string, unknown>) => {
    const res = await api.post('/citizen/grievance', payload);
    return res.data;
  },

  getGrievances: async (nid: string) => {
    const res = await api.get(`/citizen/grievances/${nid}`);
    return res.data;
  },

  bookQueue: async (payload: Record<string, unknown>) => {
    const res = await api.post('/citizen/queue/book', payload);
    return res.data;
  },

  getBhatta: async (nid: string) => {
    const res = await api.get(`/citizen/bhatta/${nid}`);
    return res.data;
  },

  getDocuments: async (nid: string) => {
    const res = await api.get(`/citizen/documents/${nid}`);
    return res.data;
  },
};

// ── VERIFICATION API ──────────────────────────────────────────

export const verifyAPI = {

  // GET /verify/:dtid
  // Zero-knowledge document verification — public endpoint
  verifyDocument: async (dtid: string) => {
    const res = await api.get(`/verify/${encodeURIComponent(dtid)}`);
    return res.data;
  },
};

// ── UI ACTION API (mapped from current mobile UI) ────────────

export const uiActionAPI = {
  getNotifications: async () => {
    const res = await api.get('/citizen/notifications');
    return res.data;
  },

  getNotices: async () => {
    const res = await api.get('/notices');
    return res.data;
  },

  getNews: async () => {
    const res = await api.get('/news');
    return res.data;
  },

  getWardMap: async (wardCode?: string) => {
    const res = await api.get('/ward/map', {
      params: { ward_code: wardCode },
    });
    return res.data;
  },

  initiateTaxPayment: async (payload: { amount?: number; tax_type?: string }) => {
    const res = await api.post('/payments/tax/initiate', payload);
    return res.data;
  },

  initiateWaterBillPayment: async (payload: { account_no?: string; amount?: number }) => {
    const res = await api.post('/payments/water/initiate', payload);
    return res.data;
  },

  initiateElectricityPayment: async (payload: { meter_no?: string; amount?: number }) => {
    const res = await api.post('/payments/electricity/initiate', payload);
    return res.data;
  },

  createEmergencyAlert: async (payload: { ward_code?: string; message?: string }) => {
    const res = await api.post('/emergency/sos', payload);
    return res.data;
  },

  getMyDocuments: async () => {
    const res = await api.get('/citizen/documents');
    return res.data;
  },

  getSupportContacts: async () => {
    const res = await api.get('/support/contacts');
    return res.data;
  },

  getOpenJobs: async () => {
    const res = await api.get('/jobs');
    return res.data;
  },

  getLostFoundFeed: async () => {
    const res = await api.get('/lost-found');
    return res.data;
  },

  reportLostFoundItem: async (payload: {
    item_type: 'LOST' | 'FOUND';
    title: string;
    description: string;
    location?: string;
  }) => {
    const res = await api.post('/lost-found/report', payload);
    return res.data;
  },
};

// ── AUTH API ──────────────────────────────────────────────────

export const authAPI = {

  scanIdentityDocument: async (documentType: 'nid' | 'citizenship' | 'license', imageUri: string) => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${documentType}.jpg`,
    } as any);

    try {
      const res = await api.post('/citizen/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return {
        success: !!res.data?.success,
        extracted: res.data?.extracted || {},
        message: res.data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        extracted: {},
        message: error?.response?.data?.message || 'OCR failed. Please enter details manually.',
      };
    }
  },

  loginWithScannedDocument: async (documentType: 'nid' | 'citizenship' | 'license', imageUri: string) => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${documentType}.jpg`,
    } as any);

    try {
      const res = await api.post('/citizen/auth/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return {
        success: !!res.data?.success,
        citizen: res.data?.citizen,
        token: res.data?.token,
        message: res.data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Direct scan login unavailable',
      };
    }
  },

  // For citizen login — validate NID against ward records
  // Note: citizen auth is different from officer auth
  // For prototype: use NID as identifier, validate basic format
  loginCitizen: async (nid: string, citizenshipNo: string) => {
    try {
      const res = await api.post('/citizen/auth', {
        nid,
        citizenship_no: citizenshipNo,
      });

      if (res.data?.success && res.data?.citizen && res.data?.token) {
        return {
          success: true,
          citizen: res.data.citizen,
          token: res.data.token,
          message: res.data?.message,
        };
      }

      return {
        success: false,
        message: res.data?.message || 'Invalid credentials',
      };
    } catch (error: any) {
      // If backend explicitly rejects credentials, surface that error and avoid mock login.
      if (error?.response) {
        return normalizeApiError(error, 'Invalid credentials');
      }

      if (REQUIRE_LIVE_BACKEND) {
        return {
          success: false,
          message: 'Backend unavailable. Please check server/database connection.',
        };
      }

      // Network/offline fallback for prototype continuity.
      if (!nid || nid.length < 5) {
        return { success: false, message: 'Invalid NID format' };
      }

      return {
        success: true,
        citizen: {
          nid,
          citizenship_no: citizenshipNo,
          name: 'नागरिक',
          ward_code: 'NPL-04-33-09',
        },
        token: `citizen-token-${nid}`,
        message: 'Offline mode: signed in with local fallback',
      };
    }
  },
};

// ── PDF DOWNLOAD ──────────────────────────────────────────────

export const documentAPI = {
  getPDFUrl: (dtid: string) => `${API_BASE}/document/pdf/${dtid}`,
};

// ── MINISTRY STATS (for home screen) ─────────────────────────

export const statsAPI = {
  getStats: async () => {
    try {
      const res = await api.get('/ministry/stats');
      return res.data;
    } catch (error) {
      return normalizeApiError(error, 'Unable to load live stats');
    }
  },

  getFeed: async (limit = 10) => {
    try {
      const res = await api.get('/ministry/feed', { params: { limit } });
      return res.data;
    } catch (error) {
      return normalizeApiError(error, 'Unable to load ministry feed');
    }
  },

  getLedgerEntries: async () => {
    try {
      const res = await api.get('/ministry/feed', { params: { limit: 20 } });
      return res.data;
    } catch (error) {
      return normalizeApiError(error, 'Unable to load ledger entries');
    }
  },
};

// ── SYSTEM / HEALTH ──────────────────────────────────────────

export const systemAPI = {
  // Expected backend contract:
  // GET /health/database -> { success: boolean, db_connected: boolean, message?: string }
  // Fallback: GET /health -> { success?: boolean, status?: string, message?: string }
  checkDatabaseHealth: async () => {
    try {
      const res = await api.get('/health/database');
      const data = res.data || {};
      return {
        success: data.success !== false,
        dbConnected: data.db_connected === true,
        message: data.message || (data.db_connected ? 'Database connected' : 'Database not connected'),
      };
    } catch {
      try {
        const res = await api.get('/health');
        const data = res.data || {};
        const healthy = data.success !== false && data.status !== 'down';
        return {
          success: healthy,
          dbConnected: healthy,
          message: data.message || (healthy ? 'Backend reachable' : 'Backend unhealthy'),
        };
      } catch {
        return {
          success: false,
          dbConnected: false,
          message: 'Backend unreachable',
        };
      }
    }
  },
};

export default api;