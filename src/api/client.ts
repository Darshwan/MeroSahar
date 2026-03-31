import axios from 'axios';
import Constants from 'expo-constants';
import { getSecureToken } from '../utils/secureStorage';

// Prefer Expo config (`expo.extra.apiBaseUrl`) and trim trailing slashes.
const configBase = String(Constants.expoConfig?.extra?.apiBaseUrl || '').trim();
const fallbackBase = 'http://192.168.1.100:8080';
export const API_BASE = (configBase || fallbackBase).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await getSecureToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
        return {
          success: false,
          message: error.response?.data?.message || 'Invalid credentials',
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
    const res = await api.get('/ministry/stats');
    return res.data;
  },
};

export default api;