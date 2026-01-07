'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const BASE_BACKEND_URL = 'https://flastal-backend.onrender.com';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  isProfessional: false,
  isApproved: false,
  isPending: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateUser: () => {},
  authenticatedFetch: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializing = useRef(true);
  const requestDebounce = useRef({});
  const router = useRouter();

  const parseUserFromToken = useCallback((rawToken, extraData = null) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined' || rawToken === '') return null;
    try {
      const cleanToken = rawToken.toString().replace(/['"]+/g, '').trim();
      const decoded = jwtDecode(cleanToken);
      if (decoded.exp * 1000 < Date.now()) return null;

      // extraData (ログインAPIのレスポンス) を優先、なければ decoded (JWT) から取得
      const role = extraData?.role || decoded.role;
      const venueName = extraData?.venueName || decoded.venueName;
      const shopName = extraData?.shopName || decoded.shopName;
      const handleName = extraData?.handleName || decoded.handleName;

      return {
        id: extraData?.id || decoded.id,
        email: extraData?.email || decoded.email,
        role: role,
        handleName: handleName,
        iconUrl: extraData?.iconUrl || decoded.iconUrl,
        shopName: shopName,
        venueName: venueName,
        status: extraData?.status || decoded.status || 'APPROVED',
        sub: decoded.sub,
        _token: cleanToken 
      };
    } catch (error) {
      return null;
    }
  }, []);

  const setSession = useCallback((newToken, extraData = null) => {
    const userData = parseUserFromToken(newToken, extraData);
    if (userData) {
      setUser(userData);
      setToken(userData._token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', userData._token);
        localStorage.setItem('flastal-token', userData._token); // 互換性のため両方保存
        localStorage.setItem('userStatus', userData.status);
      }
      return true;
    } else {
      if (!isInitializing.current) {
        setUser(null);
        setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('flastal-token');
          localStorage.removeItem('userStatus');
        }
      }
      return false;
    }
  }, [parseUserFromToken]);

  const authenticatedFetch = useCallback(async (url, options = {}, retryCount = 0) => {
    let finalUrl = url;
    if (!url.startsWith('http')) {
      const parts = url.split('?');
      let apiPath = parts[0].replace(/^\/+/, '/');
      if (!apiPath.startsWith('/api/')) {
        apiPath = `/api${apiPath}`;
      }
      const query = parts[1] ? `?${parts[1]}` : '';
      finalUrl = `${BASE_BACKEND_URL}${apiPath}${query}`;
    }

    const now = Date.now();
    const requestKey = `${finalUrl}-${options.method || 'GET'}`;
    if (requestDebounce.current[requestKey] && (now - requestDebounce.current[requestKey] < 50)) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    requestDebounce.current[requestKey] = now;

    let currentToken = token;
    if (!currentToken && typeof window !== 'undefined') {
      currentToken = localStorage.getItem('flastal-token') || localStorage.getItem('authToken');
    }

    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (currentToken) {
      const cleanToken = currentToken.replace(/['"]+/g, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }

    try {
      const response = await fetch(finalUrl, { 
        ...options, 
        headers,
        mode: 'cors'
      });
      
      if (response.status === 401 && retryCount < 1 && !finalUrl.includes('/login')) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return authenticatedFetch(url, options, retryCount + 1);
      }
      return response;
    } catch (e) {
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return authenticatedFetch(url, options, retryCount + 1);
      }
      throw e;
    }
  }, [token]);

  useEffect(() => {
    const initAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('flastal-token') || localStorage.getItem('authToken');
          if (storedToken && storedToken !== 'null') {
            const storedStatus = localStorage.getItem('userStatus');
            const storedVenue = localStorage.getItem('flastal-venue');
            const extraData = storedVenue ? JSON.parse(storedVenue) : (storedStatus ? { status: storedStatus } : null);
            setSession(storedToken, extraData);
          }
        }
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          isInitializing.current = false;
        }, 500);
      }
    };
    initAuth();
  }, [setSession]);

  const login = useCallback(async (newToken, extraData = null) => {
    isInitializing.current = false; 
    const res = setSession(newToken, extraData);
    if (res) setIsLoading(false);
    return res;
  }, [setSession]);

  const logout = useCallback(() => {
    isInitializing.current = false;
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('flastal-token');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('flastal-venue');
    setUser(null);
    setToken(null);
    window.location.href = '/';
  }, []);

  const updateUser = useCallback((newUserData) => {
    setUser(prev => prev ? { ...prev, ...newUserData } : null);
  }, []);

  const register = useCallback(async (email, password, handleName, referralCode = '') => {
    const response = await fetch(`${BASE_BACKEND_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, handleName, referralCode }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '登録に失敗しました。');
    return data;
  }, []);

  const contextValue = useMemo(() => {
    const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
    const approved = isLoading ? true : (user ? (user.status === 'APPROVED' || !isProfessional) : false);
    return {
      user, token, isAuthenticated: !!user, isLoading,
      isAdmin: user?.role === 'ADMIN',
      isProfessional, isApproved: approved,
      isPending: user?.status === 'PENDING',
      login, logout, updateUser, register, authenticatedFetch
    };
  }, [user, token, isLoading, login, logout, updateUser, register, authenticatedFetch]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);