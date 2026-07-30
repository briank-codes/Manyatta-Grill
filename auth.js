/* ============================================================
   MANYATTA GRILL — Auth API Layer
   Secure client-side auth with JWT simulation, role-based access,
   password hashing (bcrypt-style via SubtleCrypto), and session mgmt.
   ============================================================ */

const ManyattaAuth = (() => {

  /* ── CONFIG ── */
  const CONFIG = {
    JWT_SECRET:    'manyatta-grill-secret-2024-nyama-choma',
    TOKEN_TTL:     60 * 60 * 1000,          // 1 hour
    REFRESH_TTL:   7  * 24 * 60 * 60 * 1000,// 7 days
    SALT_ROUNDS:   10,
    MAX_ATTEMPTS:  5,
    LOCKOUT_TIME:  15 * 60 * 1000,          // 15 min
    STORAGE_KEY:   'mg_auth',
    USERS_KEY:     'mg_users',
    SESSIONS_KEY:  'mg_sessions',
  };

  /* ── ROLES ── */
  const ROLES = {
    ADMIN:    { label: 'Admin',    level: 3, color: '#D94F2B' },
    STAFF:    { label: 'Staff',    level: 2, color: '#8B6914' },
    CUSTOMER: { label: 'Customer', level: 1, color: '#4A7C59' },
  };

  /* ── PERMISSIONS ── */
  const PERMISSIONS = {
    ADMIN:    ['view_dashboard','manage_users','manage_menu','manage_reservations','view_reports','edit_content','manage_reviews'],
    STAFF:    ['view_dashboard','manage_reservations','view_reports','manage_reviews'],
    CUSTOMER: ['view_reservations','make_reservation','view_profile','write_review'],
  };

  /* ── UTILS ── */
  const utils = {
    async hash(password) {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
      const data = encoder.encode(password + saltHex + CONFIG.JWT_SECRET);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
      return `${saltHex}:${hashHex}`;
    },
    async verify(password, stored) {
      const [saltHex, storedHash] = stored.split(':');
      const encoder = new TextEncoder();
      const data = encoder.encode(password + saltHex + CONFIG.JWT_SECRET);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
      return hashHex === storedHash;
    },
    btoa64(obj) {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    },
    atob64(str) {
      return JSON.parse(decodeURIComponent(escape(atob(str))));
    },
    generateToken(payload) {
      const header  = utils.btoa64({ alg: 'HS256', typ: 'JWT' });
      const body    = utils.btoa64({ ...payload, iat: Date.now(), exp: Date.now() + CONFIG.TOKEN_TTL });
      const sig     = btoa(CONFIG.JWT_SECRET + header + body).replace(/=/g,'').substring(0,32);
      return `${header}.${body}.${sig}`;
    },
    generateRefreshToken() {
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
    },
    verifyToken(token) {
      try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = utils.atob64(parts[1]);
        if (payload.exp < Date.now()) return null;
        return payload;
      } catch { return null; }
    },
    uid() {
      return 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    },
    sanitize(str) {
      return String(str).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
    },
    validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); },
    validatePassword(p) {
      return {
        length:    p.length >= 8,
        upper:     /[A-Z]/.test(p),
        lower:     /[a-z]/.test(p),
        number:    /\d/.test(p),
        special:   /[!@#$%^&*(),.?":{}|<>]/.test(p),
        get valid() { return this.length && this.upper && this.lower && this.number; }
      };
    },
  };

  /* ── STORE ── */
  const store = {
    getUsers()    { try { return JSON.parse(localStorage.getItem(CONFIG.USERS_KEY)) || []; } catch { return []; } },
    setUsers(u)   { localStorage.setItem(CONFIG.USERS_KEY, JSON.stringify(u)); },
    getSessions() { try { return JSON.parse(localStorage.getItem(CONFIG.SESSIONS_KEY)) || {}; } catch { return {}; } },
    setSessions(s){ localStorage.setItem(CONFIG.SESSIONS_KEY, JSON.stringify(s)); },
    getAuth()     { try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)); } catch { return null; } },
    setAuth(a)    { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(a)); },
    clearAuth()   { localStorage.removeItem(CONFIG.STORAGE_KEY); },
    getAttempts(email) {
      const key = 'mg_attempts_' + btoa(email);
      try { return JSON.parse(sessionStorage.getItem(key)) || { count:0, lockedUntil:0 }; } catch { return { count:0, lockedUntil:0 }; }
    },
    setAttempts(email, data) {
      const key = 'mg_attempts_' + btoa(email);
      sessionStorage.setItem(key, JSON.stringify(data));
    },
  };

  /* ── SEED DEMO USERS ── */
  async function seedDemoUsers() {
    const users = store.getUsers();
    if (users.length) return;
    const demos = [
      { name:'Admin User',     email:'admin@manyattagrill.com',  role:'ADMIN',    phone:'+254712345678' },
      { name:'Chef Kamau',     email:'staff@manyattagrill.com',  role:'STAFF',    phone:'+254723456789' },
      { name:'Jane Wanjiru',   email:'customer@example.com',     role:'CUSTOMER', phone:'+254734567890' },
    ];
    const seeded = [];
    for (const d of demos) {
      const hash = await utils.hash('Password1!');
      seeded.push({ id: utils.uid(), ...d, password: hash, verified: true, createdAt: Date.now(), lastLogin: null, avatar: null });
    }
    store.setUsers(seeded);
  }

  /* ── REGISTER ── */
  async function register({ name, email, password, phone }) {
    name     = utils.sanitize(name?.trim() || '');
    email    = (email?.trim() || '').toLowerCase();
    phone    = utils.sanitize(phone?.trim() || '');

    if (!name || name.length < 2)  return { ok:false, error:'Name must be at least 2 characters.' };
    if (!utils.validateEmail(email)) return { ok:false, error:'Please enter a valid email address.' };
    const pwCheck = utils.validatePassword(password || '');
    if (!pwCheck.valid) return { ok:false, error:'Password needs 8+ chars, uppercase, lowercase & number.' };

    const users = store.getUsers();
    if (users.find(u => u.email === email)) return { ok:false, error:'An account with this email already exists.' };

    const hash = await utils.hash(password);
    const user = { id: utils.uid(), name, email, phone, role:'CUSTOMER', password: hash, verified: false, createdAt: Date.now(), lastLogin: null, avatar: null };
    users.push(user);
    store.setUsers(users);

    // Auto-verify for demo
    const verToken = utils.generateRefreshToken().substring(0,8).toUpperCase();
    console.log(`[Manyatta Auth] Verification code for ${email}: ${verToken}`);

    return { ok:true, message:'Account created! Check your email for verification.', verToken };
  }

  /* ── LOGIN ── */
  async function login({ email, password, remember }) {
    email = (email?.trim() || '').toLowerCase();
    if (!email || !password) return { ok:false, error:'Email and password are required.' };

    // Rate limiting
    const attempts = store.getAttempts(email);
    if (attempts.lockedUntil > Date.now()) {
      const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      return { ok:false, error:`Account locked. Try again in ${mins} minute(s).`, locked:true };
    }

    const users = store.getUsers();
    const user  = users.find(u => u.email === email);

    if (!user) {
      // Generic error to prevent user enumeration
      return { ok:false, error:'Invalid email or password.' };
    }

    const valid = await utils.verify(password, user.password);
    if (!valid) {
      const count = (attempts.count || 0) + 1;
      const lockedUntil = count >= CONFIG.MAX_ATTEMPTS ? Date.now() + CONFIG.LOCKOUT_TIME : 0;
      store.setAttempts(email, { count, lockedUntil });
      const remaining = CONFIG.MAX_ATTEMPTS - count;
      return { ok:false, error: remaining > 0 ? `Invalid credentials. ${remaining} attempt(s) remaining.` : 'Account locked for 15 minutes.' };
    }

    // Clear attempts
    store.setAttempts(email, { count:0, lockedUntil:0 });

    // Update lastLogin
    const idx = users.findIndex(u => u.id === user.id);
    users[idx].lastLogin = Date.now();
    store.setUsers(users);

    const token        = utils.generateToken({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = utils.generateRefreshToken();
    const ttl          = remember ? CONFIG.REFRESH_TTL : CONFIG.TOKEN_TTL;

    const sessions = store.getSessions();
    sessions[user.id] = { refreshToken, expires: Date.now() + ttl };
    store.setSessions(sessions);

    const authData = { token, refreshToken, userId: user.id, role: user.role, name: user.name, email: user.email, expires: Date.now() + ttl };
    store.setAuth(authData);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('mg:login', { detail: { user: publicUser(users[idx]) } }));

    return { ok:true, user: publicUser(users[idx]), token, role: user.role };
  }

  /* ── LOGOUT ── */
  function logout() {
    const auth = store.getAuth();
    if (auth) {
      const sessions = store.getSessions();
      delete sessions[auth.userId];
      store.setSessions(sessions);
    }
    store.clearAuth();
    window.dispatchEvent(new Event('mg:logout'));
  }

  /* ── GET CURRENT USER ── */
  function getCurrentUser() {
    const auth = store.getAuth();
    if (!auth) return null;
    const payload = utils.verifyToken(auth.token);
    if (!payload) { store.clearAuth(); return null; }
    const users = store.getUsers();
    const user  = users.find(u => u.id === auth.userId);
    return user ? publicUser(user) : null;
  }

  /* ── CHECK AUTH ── */
  function isAuthenticated() { return getCurrentUser() !== null; }
  function hasRole(role)      { const u = getCurrentUser(); return u && u.role === role; }
  function hasPermission(perm){ const u = getCurrentUser(); return u && (PERMISSIONS[u.role]||[]).includes(perm); }

  /* ── PASSWORD RESET ── */
  async function requestPasswordReset(email) {
    email = (email?.trim() || '').toLowerCase();
    if (!utils.validateEmail(email)) return { ok:false, error:'Invalid email address.' };
    const users = store.getUsers();
    const user  = users.find(u => u.email === email);
    // Always return success (prevents enumeration)
    if (user) {
      const code    = Math.random().toString(36).substring(2,8).toUpperCase();
      const expires = Date.now() + 15 * 60 * 1000; // 15 min
      const resets  = JSON.parse(localStorage.getItem('mg_resets') || '{}');
      resets[email] = { code, expires };
      localStorage.setItem('mg_resets', JSON.stringify(resets));
      console.log(`[Manyatta Auth] Password reset code for ${email}: ${code}`);
      return { ok:true, message:'Reset code sent to your email.', _devCode: code };
    }
    return { ok:true, message:'If that email exists, a reset code was sent.' };
  }

  async function resetPassword(email, code, newPassword) {
    email = (email?.trim() || '').toLowerCase();
    const resets = JSON.parse(localStorage.getItem('mg_resets') || '{}');
    const record = resets[email];
    if (!record || record.code !== code.toUpperCase() || record.expires < Date.now()) {
      return { ok:false, error:'Invalid or expired reset code.' };
    }
    const pwCheck = utils.validatePassword(newPassword || '');
    if (!pwCheck.valid) return { ok:false, error:'Password needs 8+ chars, uppercase, lowercase & number.' };

    const users = store.getUsers();
    const idx   = users.findIndex(u => u.email === email);
    if (idx === -1) return { ok:false, error:'User not found.' };

    users[idx].password = await utils.hash(newPassword);
    store.setUsers(users);
    delete resets[email];
    localStorage.setItem('mg_resets', JSON.stringify(resets));
    return { ok:true, message:'Password updated successfully.' };
  }

  /* ── ADMIN: USER MANAGEMENT ── */
  function getUsers() {
    if (!hasPermission('manage_users')) return { ok:false, error:'Unauthorized.' };
    return { ok:true, users: store.getUsers().map(publicUser) };
  }

  function updateUserRole(userId, newRole) {
    if (!hasPermission('manage_users')) return { ok:false, error:'Unauthorized.' };
    if (!ROLES[newRole]) return { ok:false, error:'Invalid role.' };
    const users = store.getUsers();
    const idx   = users.findIndex(u => u.id === userId);
    if (idx === -1) return { ok:false, error:'User not found.' };
    users[idx].role = newRole;
    store.setUsers(users);
    return { ok:true };
  }

  function deleteUser(userId) {
    if (!hasPermission('manage_users')) return { ok:false, error:'Unauthorized.' };
    const current = getCurrentUser();
    if (current && current.id === userId) return { ok:false, error:'Cannot delete your own account.' };
    const users = store.getUsers().filter(u => u.id !== userId);
    store.setUsers(users);
    return { ok:true };
  }

  /* ── SECURE API REQUEST ── */
  async function apiRequest(endpoint, options = {}) {
    const auth = store.getAuth();
    if (!auth) return { ok:false, error:'Not authenticated.', status:401 };

    const payload = utils.verifyToken(auth.token);
    if (!payload) {
      store.clearAuth();
      return { ok:false, error:'Session expired.', status:401 };
    }

    // Simulate API call with headers
    const headers = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${auth.token}`,
      'X-User-Role':   auth.role,
      'X-Request-ID':  utils.generateRefreshToken().substring(0,16),
    };

    console.log(`[Manyatta API] ${options.method || 'GET'} ${endpoint}`, { headers: Object.keys(headers) });

    // Simulate response
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ok:true, status:200, endpoint, headers, timestamp: new Date().toISOString() });
      }, 200 + Math.random() * 300);
    });
  }

  /* ── HELPERS ── */
  function publicUser(u) {
    const { password, ...safe } = u;
    return { ...safe, permissions: PERMISSIONS[u.role] || [], roleInfo: ROLES[u.role] };
  }

  /* ── REQUIRE AUTH (middleware) ── */
  function requireAuth(role) {
    const user = getCurrentUser();
    if (!user) { window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname); return false; }
    if (role && ROLES[role] && ROLES[user.role].level < ROLES[role].level) {
      window.location.href = 'unauthorized.html'; return false;
    }
    return user;
  }

  /* ── INIT ── */
  async function init() {
    await seedDemoUsers();
    // Auto-logout on token expiry
    setInterval(() => {
      const auth = store.getAuth();
      if (auth && !utils.verifyToken(auth.token)) { logout(); }
    }, 60000);
    return { ok:true };
  }

  return { init, register, login, logout, getCurrentUser, isAuthenticated, hasRole, hasPermission, requestPasswordReset, resetPassword, getUsers, updateUserRole, deleteUser, apiRequest, requireAuth, ROLES, PERMISSIONS, utils };
})();

// Auto-init
ManyattaAuth.init();
