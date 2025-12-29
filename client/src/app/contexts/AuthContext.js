'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

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
  
  const router = useRouter();

  const parseUserFromToken = useCallback((rawToken, extraData = null) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined' || rawToken === '') return null;
    try {
      const cleanToken = rawToken.toString().replace(/['"]+/g, '').trim();
      const decoded = jwtDecode(cleanToken);
      if (decoded.exp * 1000 < Date.now()) return null;

      let displayName = decoded.handleName;
      if (decoded.role === 'FLORIST') displayName = decoded.shopName || decoded.handleName;
      if (decoded.role === 'VENUE') displayName = decoded.venueName || decoded.handleName;
      if (decoded.role === 'ORGANIZER') displayName = decoded.name || decoded.handleName;

      return {
        id: extraData?.id || decoded.id,
        email: extraData?.email || decoded.email,
        role: extraData?.role || decoded.role,
        handleName: displayName,
        iconUrl: extraData?.iconUrl || decoded.iconUrl,
        shopName: extraData?.shopName || decoded.shopName,
        venueName: extraData?.venueName || decoded.venueName,
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
        localStorage.setItem('userStatus', userData.status);
      }
      return true;
    } else {
      // ログアウト以外（初期化中など）では、絶対に勝手にクリアしない
      if (!isInitializing.current) {
        setUser(null);
        setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userStatus');
        }
      }
      return false;
    }
  }, [parseUserFromToken]);

  // ★ ネットワーク不安定やSafariの制限に耐えるリトライ付きFetch
  const authenticatedFetch = useCallback(async (url, options = {}, retryCount = 0) => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : token;
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (storedToken) {
      const cleanToken = storedToken.replace(/['"]+/g, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      // Safari等で一時的に認証が弾かれた場合、1回だけ自動リトライ
      if (response.status === 401 && retryCount < 1 && !url.includes('/login')) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return authenticatedFetch(url, options, retryCount + 1);
      }
      return response;
    } catch (e) {
      // 通信エラー時も1回リトライ
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return authenticatedFetch(url, options, retryCount + 1);
      }
      throw e;
    }
  }, [token]);

  useEffect(() => {
    const initAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('authToken');
          if (storedToken && storedToken !== 'null') {
            const storedStatus = localStorage.getItem('userStatus');
            setSession(storedToken, storedStatus ? { status: storedStatus } : null);
          }
        }
      } finally {
        // ロード完了を遅らせ、ステートを確実に固定
        setTimeout(() => {
          setIsLoading(false);
          isInitializing.current = false;
        }, 1000);
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
    localStorage.removeItem('userStatus');
    setUser(null);
    setToken(null);
    window.location.href = '/';
  }, []);

  const updateUser = useCallback((newUserData) => {
    setUser(prev => prev ? { ...prev, ...newUserData } : null);
  }, []);

  const contextValue = useMemo(() => {
    const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
    const approved = isLoading ? true : (user ? (user.status === 'APPROVED' || !isProfessional) : false);

    return {
      user, token, isAuthenticated: !!user, isLoading,
      isAdmin: user?.role === 'ADMIN',
      isProfessional, isApproved: approved,
      isPending: user?.status === 'PENDING',
      login, logout, updateUser, authenticatedFetch
    };
  }, [user, token, isLoading, login, logout, updateUser, authenticatedFetch]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);