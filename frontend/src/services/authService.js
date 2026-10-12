import { API_BASE_URL } from './api';

const TOKEN_KEY = 'careersense_token';
const USER_KEY = 'careersense_user';
const REMEMBER_KEY = 'careersense_remember';

export function getAuthToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    null
  );
}

export function getAuthUser() {
  try {
    const raw =
      localStorage.getItem(USER_KEY) ||
      sessionStorage.getItem(USER_KEY) ||
      localStorage.getItem('user') ||
      sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const authService = {
  getToken() {
    return getAuthToken();
  },

  getUser() {
    return getAuthUser();
  },

  setAuth(token, user, rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('token', token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem(REMEMBER_KEY, 'true');
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem('token', token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('user');
      localStorage.removeItem(REMEMBER_KEY);
    }
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('user');
  },

  async getCaptcha() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/captcha`);
      if (!res.ok) throw new Error('Failed to load CAPTCHA');
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async login(email, password, captcha, captchaToken, rememberMe = true) {
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          captcha: captcha.trim(),
          captcha_token: captchaToken,
        }),
      });
    } catch (netErr) {
      const err = new Error('Unable to connect to the server. Please make sure the backend is running.');
      err.status = 0;
      throw err;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Invalid email or password.');
      err.status = res.status;
      err.data = data;
      throw err;
    }

    const token = data.access_token || data.token;
    if (token && data.user) {
      this.setAuth(token, data.user, rememberMe);
    }

    return data;
  },

  async register(userData) {
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch (netErr) {
      const err = new Error('Unable to connect to the server. Please make sure the backend is running.');
      err.status = 0;
      throw err;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Registration failed.');
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      this.clearAuth();
      throw new Error('Session expired.');
    }

    return await res.json();
  },

  async logout() {
    const token = this.getToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearAuth();
    }
  },
};

export default authService;

