import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteSecureToken, getSecureToken, setSecureToken } from '../utils/secureStorage';

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
  isHydrated: boolean;
  isLoggedIn: boolean;
  isGuest: boolean;
  sessionRole: 'anonymous' | 'guest' | 'citizen';
  citizen: Citizen | null;
  token: string | null;
  language: string;

  // Requests — stored locally so citizen can track them
  myRequests: RequestRecord[];

  // Actions
  setLanguage: (lang: string) => void;
  continueAsGuest: () => Promise<void>;
  login: (citizen: Citizen, token: string) => Promise<void>;
  logout: () => Promise<void>;
  addRequest: (req: RequestRecord) => Promise<void>;
  updateRequest: (requestId: string, updates: Partial<RequestRecord>) => Promise<void>;
  syncRequestsFromServer: (serverRequests: RequestRecord[]) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isHydrated: false,
  isLoggedIn: false,
  isGuest: false,
  sessionRole: 'anonymous',
  citizen: null,
  token: null,
  language: 'ne', // default Nepali
  myRequests: [],

  setLanguage: (lang) => {
    set({ language: lang });
    AsyncStorage.setItem('app_language', lang);
  },

  continueAsGuest: async () => {
    await AsyncStorage.setItem('guest_mode', '1');
    set({
      isGuest: true,
      isLoggedIn: false,
      sessionRole: 'guest',
      citizen: null,
      token: null,
    });
  },

  login: async (citizen, token) => {
    await setSecureToken(token);
    await AsyncStorage.setItem('citizen_data', JSON.stringify(citizen));
    await AsyncStorage.removeItem('guest_mode');
    set({
      isLoggedIn: true,
      isGuest: false,
      sessionRole: 'citizen',
      citizen,
      token,
    });
  },

  logout: async () => {
    await deleteSecureToken();
    await AsyncStorage.multiRemove(['citizen_data', 'guest_mode', 'my_requests']);
    set({
      isLoggedIn: false,
      isGuest: false,
      sessionRole: 'anonymous',
      citizen: null,
      token: null,
      myRequests: [],
    });
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

  syncRequestsFromServer: async (serverRequests) => {
    const localRequests = get().myRequests;
    const map = new Map<string, RequestRecord>();

    for (const localReq of localRequests) {
      map.set(localReq.request_id, localReq);
    }

    // Server remains source of truth for status fields while preserving any local-only fields.
    for (const serverReq of serverRequests) {
      const localReq = map.get(serverReq.request_id);
      map.set(serverReq.request_id, {
        ...localReq,
        ...serverReq,
      });
    }

    const merged = Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.submitted_at).getTime() || 0;
      const bTime = new Date(b.submitted_at).getTime() || 0;
      return bTime - aTime;
    });

    await AsyncStorage.setItem('my_requests', JSON.stringify(merged));
    set({ myRequests: merged });
  },

  loadFromStorage: async () => {
    try {
      const [token, citizenStr, requestsStr, lang, guestMode] = await Promise.all([
        getSecureToken(),
        AsyncStorage.getItem('citizen_data'),
        AsyncStorage.getItem('my_requests'),
        AsyncStorage.getItem('app_language'),
        AsyncStorage.getItem('guest_mode'),
      ]);

      const citizen = citizenStr ? JSON.parse(citizenStr) : null;
      const isCitizenSession = !!token && !!citizen;
      const isGuestSession = !isCitizenSession && guestMode === '1';

      set({
        token,
        isLoggedIn: isCitizenSession,
        isGuest: isGuestSession,
        sessionRole: isCitizenSession ? 'citizen' : (isGuestSession ? 'guest' : 'anonymous'),
        citizen,
        myRequests: requestsStr ? JSON.parse(requestsStr) : [],
        language: lang || 'ne',
        isHydrated: true,
      });
    } catch (e) {
      console.error('Store load error:', e);
      set({ isHydrated: true });
    }
  },
}));