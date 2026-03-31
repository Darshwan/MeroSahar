import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Citizen {
  nid: string;
  citizenship_no: string;
  name: string;
  ward_code: string;
}

interface RequestRecord {
  request_id: string;
  document_type: string;
  purpose: string;
  status: string;
  submitted_at: string;
  dtid?: string;
  qr_data?: string;
}

interface AppState {
  // Auth
  isLoggedIn: boolean;
  citizen: Citizen | null;
  token: string | null;
  language: string;

  // Requests — stored locally so citizen can track them
  myRequests: RequestRecord[];

  // Actions
  setLanguage: (lang: string) => void;
  login: (citizen: Citizen, token: string) => Promise<void>;
  logout: () => Promise<void>;
  addRequest: (req: RequestRecord) => Promise<void>;
  updateRequest: (requestId: string, updates: Partial<RequestRecord>) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  citizen: null,
  token: null,
  language: 'ne', // default Nepali
  myRequests: [],

  setLanguage: (lang) => {
    set({ language: lang });
    AsyncStorage.setItem('app_language', lang);
  },

  login: async (citizen, token) => {
    await AsyncStorage.setItem('pratibimba_token', token);
    await AsyncStorage.setItem('citizen_data', JSON.stringify(citizen));
    set({ isLoggedIn: true, citizen, token });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['pratibimba_token', 'citizen_data']);
    set({ isLoggedIn: false, citizen: null, token: null });
  },

  addRequest: async (req) => {
    const current = get().myRequests;
    const updated = [req, ...current];
    await AsyncStorage.setItem('my_requests', JSON.stringify(updated));
    set({ myRequests: updated });
  },

  updateRequest: async (requestId, updates) => {
    const current = get().myRequests;
    const updated = current.map(r =>
      r.request_id === requestId ? { ...r, ...updates } : r
    );
    await AsyncStorage.setItem('my_requests', JSON.stringify(updated));
    set({ myRequests: updated });
  },

  loadFromStorage: async () => {
    try {
      const [token, citizenStr, requestsStr, lang] = await Promise.all([
        AsyncStorage.getItem('pratibimba_token'),
        AsyncStorage.getItem('citizen_data'),
        AsyncStorage.getItem('my_requests'),
        AsyncStorage.getItem('app_language'),
      ]);
      set({
        token,
        isLoggedIn: !!token,
        citizen: citizenStr ? JSON.parse(citizenStr) : null,
        myRequests: requestsStr ? JSON.parse(requestsStr) : [],
        language: lang || 'ne',
      });
    } catch (e) {
      console.error('Store load error:', e);
    }
  },
}));