// Client applicatif remplaçant le SDK hébergé Base44.
// Toute la logique métier vit maintenant dans server/ (Express + Neon) ;
// ce fichier ne fait que parler HTTP à cette API avec le même contrat que
// l'ancien `db.entities.X.list()/.filter()/.create()/...` pour ne pas avoir
// à réécrire chaque page.

// Same-origin by default: the API is deployed as Cloudflare Pages Functions
// alongside this static site, so relative /api/... requests just work. Set
// VITE_API_URL only if the backend is ever hosted on a different origin.
const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'kolo_token';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // stockage indisponible (mode privé, etc.) — on continue sans persister
  }
}

async function request(path, { method = 'GET', body, query } = {}) {
  let url = `${API_BASE}${path}`;
  if (query) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    if (qs) url += `?${qs}`;
  }
  const token = getToken();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // "Failed to fetch" seul ne dit rien à l'utilisateur ni au développeur.
    // Le backend est déployé en Cloudflare Pages Functions à la même origine
    // par défaut ; si ça échoue quand même, l'API n'a probablement pas pu se
    // connecter à Neon (DATABASE_URL manquant/invalide côté Cloudflare) ou
    // VITE_API_URL pointe vers une origine injoignable.
    console.error(`[api] Impossible de joindre ${API_BASE}${path} :`, networkErr);
    throw new Error(
      `Serveur injoignable (${API_BASE || 'même origine'}). Vérifiez la configuration ` +
      `Cloudflare Pages (variable DATABASE_URL) et, si vous utilisez un backend externe, VITE_API_URL.`
    );
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || `Erreur ${res.status}`;
    const err = new Error(data?.detail ? `${message} (${data.detail})` : message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function makeEntityClient(name) {
  const base = `/api/entities/${name}`;
  return {
    list: (sort, limit) => request(base, { query: { sort, limit } }),
    filter: (filterObj = {}, sort, limit) =>
      request(base, { query: { filter: JSON.stringify(filterObj), sort, limit } }),
    get: (id) => request(`${base}/${id}`),
    create: (data) => request(base, { method: 'POST', body: data }),
    update: (id, data) => request(`${base}/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
    bulkCreate: (items) => request(`${base}/bulk`, { method: 'POST', body: items }),
    bulkUpdate: (items) => request(`${base}/bulk`, { method: 'PUT', body: items }),
  };
}

// Household et User ont des routes dédiées côté serveur (portée spéciale).
const householdClient = {
  get: () => request('/api/household'),
  create: (data) => request('/api/household', { method: 'POST', body: data }),
  update: (data) => request('/api/household', { method: 'PUT', body: data }),
  join: (invite_code) => request('/api/household/join', { method: 'POST', body: { invite_code } }),
};

const userClient = {
  list: () => request('/api/entities-users'),
  update: (id, data) => request(`/api/entities-users/${id}`, { method: 'PUT', body: data }),
  listAll: () => request('/api/entities-users/all'),
};

const entitiesProxy = new Proxy(
  { Household: householdClient, User: userClient },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== 'string') return undefined;
      return makeEntityClient(prop);
    },
  }
);

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}

export const db = {
  auth: {
    isAuthenticated: async () => !!getToken(),
    me: async () => {
      if (!getToken()) return null;
      try {
        return await request('/api/auth/me');
      } catch {
        setToken(null);
        return null;
      }
    },
    updateMe: async (data) => request('/api/auth/me', { method: 'PUT', body: data }),
    loginViaEmailPassword: async (email, password) => {
      const { token, user } = await request('/api/auth/login', { method: 'POST', body: { email, password } });
      setToken(token);
      return user;
    },
    register: async (email, password, full_name) => {
      const { token, user } = await request('/api/auth/register', {
        method: 'POST',
        body: { email, password, full_name },
      });
      setToken(token);
      return user;
    },
    loginWithProvider: async () => {
      throw new Error('Connexion via fournisseur externe non configurée côté serveur.');
    },
    logout: async () => {
      await request('/api/auth/logout', { method: 'POST' }).catch(() => {});
      setToken(null);
    },
    redirectToLogin: () => {
      window.location.href = '/Login';
    },
    setToken,
    resetPasswordRequest: (email) => request('/api/auth/reset-password-request', { method: 'POST', body: { email } }),
    resetPassword: (token, password) => request('/api/auth/reset-password', { method: 'POST', body: { token, password } }),
    resendOtp: async () => {
      throw new Error("Vérification par code (OTP) non configurée — l'inscription valide directement le compte.");
    },
    verifyOtp: async () => {
      throw new Error("Vérification par code (OTP) non configurée — l'inscription valide directement le compte.");
    },
  },
  entities: entitiesProxy,
  integrations: {
    Core: {
      UploadPublicFile: async ({ file }) => {
        const data_url = await fileToDataUrl(file);
        return request('/api/uploads', { method: 'POST', body: { filename: file.name, data_url } });
      },
      UploadFile: async ({ file }) => {
        const data_url = await fileToDataUrl(file);
        return request('/api/uploads', { method: 'POST', body: { filename: file.name, data_url } });
      },
    },
  },
};

export const base44 = db;
export default db;

// --- Helpers additionnels utilisés directement par certaines pages ---
export const getExchangeRates = () => request('/api/exchange-rates');
export const sendHouseholdInvite = (payload) => request('/api/invite', { method: 'POST', body: payload });
export const createCheckoutSession = (plan) => request('/api/checkout/create', { method: 'POST', body: { plan } });
export const superAdminApi = {
  dashboard: () => request('/api/superadmin/dashboard'),
  households: () => request('/api/superadmin/households'),
  suspendHousehold: (id, suspended) =>
    request(`/api/superadmin/households/${id}/suspend`, { method: 'POST', body: { suspended } }),
  updateSubscription: (id, data) =>
    request(`/api/superadmin/households/${id}/subscription`, { method: 'PUT', body: data }),
  updatePlatformSettings: (data) => request('/api/superadmin/platform-settings', { method: 'PUT', body: data }),
  team: () => request('/api/superadmin/team'),
  addTeamMember: (email, role) => request('/api/superadmin/team', { method: 'POST', body: { email, role } }),
  removeTeamMember: (email) => request(`/api/superadmin/team/${encodeURIComponent(email)}`, { method: 'DELETE' }),
};
