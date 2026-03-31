import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Change this to your server IP when testing on physical device
// Use your computer's local IP, not localhost
// Example: 'http://192.168.1.5:8080'
export const API_BASE = 'http://192.168.1.100:8080';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('pratibimba_token');
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
  // Note: implement this endpoint in Go backend if needed
  // For prototype: store request IDs locally in AsyncStorage
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

  // For citizen login — validate NID against ward records
  // Note: citizen auth is different from officer auth
  // For prototype: use NID as identifier, validate basic format
  loginCitizen: async (nid: string, citizenshipNo: string) => {
    // In production: POST to /citizen/auth with NID + citizenship
    // For prototype: return mock success if format is valid
    if (!nid || nid.length < 5) {
      throw new Error('Invalid NID format');
    }
    // Mock response for prototype
    return {
      success: true,
      citizen: {
        nid,
        citizenship_no: citizenshipNo,
        name: 'नागरिक',  // Will be filled from OCR
        ward_code: 'NPL-04-33-09',
      },
      token: `citizen-token-${nid}`,
    };
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