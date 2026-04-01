export type UiEndpoint = {
  screen: string;
  element: string;
  action: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authRequired: boolean;
};

// Canonical UI -> backend endpoint map based on current RN screens and provided HTML references.
export const UI_ENDPOINT_MAP: UiEndpoint[] = [
  // Home / Sewa Engine
  { screen: 'Home', element: 'Top Notifications Icon', action: 'load notifications', endpoint: '/citizen/notifications', method: 'GET', authRequired: true },
  { screen: 'Home', element: 'Notices View All', action: 'load notices feed', endpoint: '/notices', method: 'GET', authRequired: false },
  { screen: 'Home', element: 'Pokhara Samachar', action: 'load news feed', endpoint: '/news', method: 'GET', authRequired: false },
  { screen: 'Home', element: 'Open Ward Map Button', action: 'get ward map link/meta', endpoint: '/ward/map', method: 'GET', authRequired: false },
  { screen: 'Home', element: 'Pay Tax Service Card', action: 'start tax payment', endpoint: '/payments/tax/initiate', method: 'POST', authRequired: true },
  { screen: 'Home', element: 'Water Bill Service Card', action: 'start water payment', endpoint: '/payments/water/initiate', method: 'POST', authRequired: true },
  { screen: 'Home', element: 'NEA Pay Service Card', action: 'start electricity payment', endpoint: '/payments/electricity/initiate', method: 'POST', authRequired: true },
  { screen: 'Home', element: 'Sifarish Service Card', action: 'open request workflow', endpoint: '/citizen/request', method: 'POST', authRequired: true },
  { screen: 'Home', element: 'PRATIBIMBA Live Card', action: 'load ministry stats', endpoint: '/ministry/stats', method: 'GET', authRequired: false },
  { screen: 'Home', element: 'Emergency FAB', action: 'create SOS alert', endpoint: '/emergency/sos', method: 'POST', authRequired: false },

  // Auth
  { screen: 'Login', element: 'Login Button', action: 'authenticate citizen', endpoint: '/citizen/auth', method: 'POST', authRequired: false },
  { screen: 'Login', element: 'Scan Login Camera', action: 'direct OCR login', endpoint: '/citizen/auth/ocr', method: 'POST', authRequired: false },
  { screen: 'Login', element: 'OCR Prefill Camera', action: 'extract identity fields', endpoint: '/citizen/ocr', method: 'POST', authRequired: false },

  // Requests + Tracking
  { screen: 'Request', element: 'Submit Request Button', action: 'submit document request', endpoint: '/citizen/request', method: 'POST', authRequired: true },
  { screen: 'Track', element: 'Track Refresh', action: 'load all citizen requests', endpoint: '/citizen/requests', method: 'GET', authRequired: true },
  { screen: 'Track', element: 'Status Poll Per Item', action: 'load request status', endpoint: '/citizen/request/:requestId', method: 'GET', authRequired: true },
  { screen: 'Track', element: 'Download PDF Button', action: 'open issued PDF', endpoint: '/document/pdf/:dtid', method: 'GET', authRequired: false },

  // Verify
  { screen: 'Verify', element: 'QR Scan Result', action: 'verify scanned DTID', endpoint: '/verify/:dtid', method: 'GET', authRequired: false },
  { screen: 'Verify', element: 'Manual Verify Button', action: 'verify entered DTID', endpoint: '/verify/:dtid', method: 'GET', authRequired: false },

  // Profile / Citizen Portal concepts
  { screen: 'Profile', element: 'My Documents', action: 'list issued documents', endpoint: '/citizen/documents', method: 'GET', authRequired: true },
  { screen: 'Profile', element: 'Help & Support', action: 'load support contacts', endpoint: '/support/contacts', method: 'GET', authRequired: false },
  { screen: 'Profile', element: 'Logout', action: 'local session cleanup', endpoint: '(client-side)', method: 'POST', authRequired: false },

  // Infra checks
  { screen: 'System', element: 'DB Health Check', action: 'check db connectivity', endpoint: '/health/database', method: 'GET', authRequired: false },
  { screen: 'System', element: 'Backend Health Fallback', action: 'check backend health', endpoint: '/health', method: 'GET', authRequired: false },
];
