import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteSecureToken, getSecureToken, setSecureToken } from '../utils/secureStorage';

export type SessionType = 'CITIZEN' | 'TOURIST' | 'GUEST' | null;

export interface CitizenData {
  nid: string;
  name: string;
  name_ne?: string;
  citizenship_no: string;
  ward_code: string;
  ward_number?: number;
  district?: string;
  province?: string;
  phone?: string;
  gender?: string;
}

export interface TouristData {
  passport_no: string;
  name: string;
  nationality: string;
}

export interface RequestRecord {
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
  sessionType: SessionType;
  sessionToken: string | null;
  citizen: CitizenData | null;
  tourist: TouristData | null;
  token: string | null;
  language: string;

  // Requests — stored locally so citizen can track them
  myRequests: RequestRecord[];

  // Actions
  setLanguage: (lang: string) => void;
  loginAsCitizen: (citizen: CitizenData, token: string) => Promise<void>;
  loginAsTourist: (tourist: TouristData, token: string) => Promise<void>;
  loginAsGuest: (token: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  login: (citizen: CitizenData, token: string) => Promise<void>;
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
  sessionType: null,
  sessionToken: null,
  citizen: null,
  tourist: null,
  token: null,
  language: 'ne', // default Nepali
  myRequests: [],

  setLanguage: (lang) => {
    set({ language: lang });
    AsyncStorage.setItem('app_language', lang);
  },

  loginAsCitizen: async (citizen, token) => {
    await Promise.all([
      setSecureToken(token),
      AsyncStorage.multiSet([
        ['session_token', token],
        ['session_type', 'CITIZEN'],
        ['citizen_data', JSON.stringify(citizen)],
      ]),
      AsyncStorage.multiRemove(['guest_mode', 'tourist_data']),
    ]);

    set({
      isLoggedIn: true,
      isGuest: false,
      sessionRole: 'citizen',
      sessionType: 'CITIZEN',
      sessionToken: token,
      citizen,
      tourist: null,
      token,
    });
  },

  loginAsTourist: async (tourist, token) => {
    await Promise.all([
      setSecureToken(token),
      AsyncStorage.multiSet([
        ['session_token', token],
        ['session_type', 'TOURIST'],
        ['tourist_data', JSON.stringify(tourist)],
      ]),
      AsyncStorage.multiRemove(['guest_mode', 'citizen_data']),
    ]);

    set({
      isLoggedIn: true,
      isGuest: false,
      sessionRole: 'guest',
      sessionType: 'TOURIST',
      sessionToken: token,
      tourist,
      citizen: null,
      token,
    });
  },

  loginAsGuest: async (token) => {
    await Promise.all([
      AsyncStorage.multiSet([
        ['session_token', token],
        ['session_type', 'GUEST'],
        ['guest_mode', '1'],
      ]),
      AsyncStorage.multiRemove(['citizen_data', 'tourist_data']),
      deleteSecureToken(),
    ]);

    set({
      isGuest: true,
      isLoggedIn: false,
      sessionRole: 'guest',
      sessionType: 'GUEST',
      sessionToken: token,
      citizen: null,
      tourist: null,
      token: null,
    });
  },

  continueAsGuest: async () => {
    const generatedToken = `guest-${Date.now()}`;
    await get().loginAsGuest(generatedToken);
  },

  login: async (citizen, token) => {
    await get().loginAsCitizen(citizen, token);
  },

  logout: async () => {
    await deleteSecureToken();
    await AsyncStorage.multiRemove([
      'session_token',
      'session_type',
      'citizen_data',
      'tourist_data',
      'guest_mode',
      'my_requests',
    ]);
    set({
      isLoggedIn: false,
      isGuest: false,
      sessionRole: 'anonymous',
      sessionType: null,
      sessionToken: null,
      citizen: null,
      tourist: null,
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
      const [secureToken, sessionToken, sessionTypeRaw, citizenStr, touristStr, requestsStr, lang, guestMode] = await Promise.all([
        getSecureToken(),
        AsyncStorage.getItem('session_token'),
        AsyncStorage.getItem('session_type'),
        AsyncStorage.getItem('citizen_data'),
        AsyncStorage.getItem('tourist_data'),
        AsyncStorage.getItem('my_requests'),
        AsyncStorage.getItem('app_language'),
        AsyncStorage.getItem('guest_mode'),
      ]);

      const citizen = citizenStr ? JSON.parse(citizenStr) : null;
      const tourist = touristStr ? JSON.parse(touristStr) : null;
      const token = secureToken || sessionToken;
      const sessionType = (sessionTypeRaw as SessionType) || null;

      const isCitizenSession = (sessionType === 'CITIZEN' && !!token && !!citizen) || (!!token && !!citizen);
      const isGuestSession = !isCitizenSession && guestMode === '1';

      set({
        sessionToken,
        sessionType,
        token,
        isLoggedIn: isCitizenSession,
        isGuest: isGuestSession,
        sessionRole: isCitizenSession ? 'citizen' : (isGuestSession ? 'guest' : 'anonymous'),
        citizen,
        tourist,
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