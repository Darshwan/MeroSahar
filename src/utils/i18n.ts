// Central translation file — add keys here for every new string

type Lang = 'ne' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  'nav.home':      { ne: 'गृहपृष्ठ',    en: 'Home'       },
  'nav.sewa':      { ne: 'सेवा',          en: 'Services'   },
  'nav.pokhara':   { ne: 'पोखरा',        en: 'Pokhara'    },
  'nav.profile':   { ne: 'प्रोफाइल',    en: 'Profile'    },

  // Home screen
  'home.greeting': { ne: 'नमस्ते, पोखरा', en: 'Namaste, Pokhara' },
  'home.search':   { ne: 'आज के चाहिन्छ?', en: 'What do you need today?' },
  'home.notices':  { ne: 'सूचना',        en: 'Notices'    },
  'home.viewAll':  { ne: 'सबै हेर्नुस्', en: 'View All'  },

  // Sewa screen
  'sewa.title':    { ne: 'सेवा केन्द्र',  en: 'Service Center' },
  'sewa.aiSifaris':{ ne: 'AI-OCR सिफारिस', en: 'AI-OCR Sifaris' },
  'sewa.liveStatus':{ ne: 'जीवन्त स्थिति', en: 'Live Status' },
  'sewa.taxPortal':{ ne: 'कर पोर्टल',   en: 'Tax Portal'  },
  'sewa.mirrorVault':{ ne: 'मिरर भल्ट', en: 'Mirror Vault' },
  'sewa.queueToken':{ ne: 'कतार टोकन',  en: 'Queue Token' },
  'sewa.krisiAnudan':{ ne: 'कृषि अनुदान', en: 'Krishi Anudan' },
  'sewa.bhatta':   { ne: 'सामाजिक सुरक्षा', en: 'Social Security' },
  'sewa.reportProblem':{ ne: 'समस्या रिपोर्ट गर्नुस्', en: 'Report a Problem' },

  // Document types
  'doc.SIFARIS':          { ne: 'सिफारिस',           en: 'Sifaris'           },
  'doc.TAX_CLEARANCE':    { ne: 'कर चुक्ता',          en: 'Tax Clearance'     },
  'doc.BIRTH_CERTIFICATE':{ ne: 'जन्मदर्ता',          en: 'Birth Certificate' },
  'doc.INCOME_PROOF':     { ne: 'आय प्रमाण',          en: 'Income Proof'      },
  'doc.LAND_REGISTRATION':{ ne: 'जग्गा दर्ता',        en: 'Land Registration' },

  // Status labels
  'status.PENDING':       { ne: 'विचाराधीन',          en: 'Pending'           },
  'status.UNDER_REVIEW':  { ne: 'समीक्षामा',          en: 'Under Review'      },
  'status.APPROVED':      { ne: 'स्वीकृत',            en: 'Approved'          },
  'status.REJECTED':      { ne: 'अस्वीकृत',           en: 'Rejected'          },

  // Profile
  'profile.digitalID':    { ne: 'डिजिटल परिचयपत्र',  en: 'Digital National ID' },
  'profile.myDocs':       { ne: 'मेरा कागजहरू',       en: 'My Documents'      },
  'profile.jobPortal':    { ne: 'रोजगार पोर्टल',      en: 'Job Portal'        },
  'profile.lostFound':    { ne: 'हराएको/भेटिएको',    en: 'Lost & Found'      },
  'profile.language':     { ne: 'भाषा',               en: 'Language'          },
  'profile.logout':       { ne: 'बाहिर निस्कनुस्',   en: 'Logout'            },

  // SOS
  'sos.title':            { ne: 'आपतकालीन सहायता',   en: 'Emergency Help'    },
  'sos.sending':          { ne: 'पठाउँदै छ...',       en: 'Sending...'        },
  'sos.sent':             { ne: 'सहायता आउँदैछ!',     en: 'Help is coming!'   },

  // Ward info
  'ward.population':      { ne: 'जनसंख्या',           en: 'Population'        },
  'ward.households':      { ne: 'घरपरिवार',           en: 'Households'        },
  'ward.phone':           { ne: 'फोन',                 en: 'Phone'             },
  'ward.email':           { ne: 'इमेल',                en: 'Email'             },

  // Auth
  'auth.login':           { ne: 'प्रवेश गर्नुस्',    en: 'Login'             },
  'auth.nid':             { ne: 'राष्ट्रिय परिचय पत्र', en: 'NID Card'        },
  'auth.citizenship':     { ne: 'नागरिकता',           en: 'Citizenship'       },
  'auth.license':         { ne: 'सवारी अनुमतिपत्र',  en: 'Driving License'   },
  'auth.passport':        { ne: 'राहदानी',            en: 'Passport'          },

  // Common
  'common.submit':        { ne: 'पेश गर्नुस्',        en: 'Submit'            },
  'common.cancel':        { ne: 'रद्द गर्नुस्',       en: 'Cancel'            },
  'common.loading':       { ne: 'लोड हुँदैछ...',      en: 'Loading...'        },
  'common.error':         { ne: 'त्रुटि',              en: 'Error'             },
  'common.success':       { ne: 'सफल',                 en: 'Success'           },
  'common.viewAll':       { ne: 'सबै हेर्नुस्',       en: 'View All'          },
  'common.back':          { ne: 'पछाडि',               en: 'Back'              },
};

// ── The Hook — use this in every component ────────────────────
import { useStore } from '../store/useStore';

export function useTranslation() {
  const { language } = useStore();
  const lang = (language || 'ne') as Lang;

  const t = (key: string, fallback?: string): string => {
    if (translations[key]) {
      return translations[key][lang] || translations[key]['en'] || fallback || key;
    }
    return fallback || key;
  };

  // For inline bilingual display
  const both = (key: string) => ({
    ne: translations[key]?.ne || key,
    en: translations[key]?.en || key,
  });

  return { t, lang, both };
}

// Usage in any component:
// const { t, lang } = useTranslation();
// <Text>{t('sewa.title')}</Text>
// — shows 'सेवा केन्द्र' in Nepali, 'Service Center' in English
