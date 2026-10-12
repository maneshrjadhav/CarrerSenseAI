import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      const currentToken = authService.getToken();
      if (currentToken) {
        try {
          const res = await authService.getCurrentUser();
          if (res && res.user) {
            setUser(res.user);
          }
        } catch (err) {
          // Token invalid or expired
          authService.clearAuth();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }

    verifyAuth();
  }, []);

  const login = async (email, password, captcha, captchaToken, rememberMe = true) => {
    const res = await authService.login(email, password, captcha, captchaToken, rememberMe);
    const receivedToken = res.access_token || res.token;
    if (receivedToken && res.user) {
      setToken(receivedToken);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid login response from server.');
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      const isRemember = localStorage.getItem('careersense_remember') === 'true';
      authService.setAuth(token, updated, isRemember);
      return updated;
    });
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
