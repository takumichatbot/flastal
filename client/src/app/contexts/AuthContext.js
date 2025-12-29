'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter, usePathname } from 'next/navigation';
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
  
  const router = useRouter();

  const parseUserFromToken = useCallback((rawToken, extraData = null) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined' || rawToken === '') return null;
    
    try {
      const cleanToken = rawToken.toString().replace(/['"]+/g, '').trim();
      const decoded = jwtDecode(cleanToken);

      if (decoded.exp * 1000 < Date.now()) {
        console.warn("Auth: Token expired");
        return null;
      }

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
      console.error("Auth: Token decode failed", error);
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
      setUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userStatus');
      }
      return false;
    }
  }, [parseUserFromToken]);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : token;
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (storedToken) {
      const cleanToken = storedToken.replace(/['"]+/g, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }
    return await fetch(url, { ...options, headers });
  }, [token]);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('authToken');
          if (storedToken) {
            const storedStatus = localStorage.getItem('userStatus');
            setSession(storedToken, storedStatus ? { status: storedStatus } : null);
          }
        }
      } catch (e) {
        console.error("Auth: Initialization failed", e);
      } finally {
        // Safariのストレージ読み込み待ちとして少し長めに設定
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    initAuth();
  }, [setSession]);

  const login = useCallback(async (newToken, extraData = null) => {
    const success = setSession(newToken, extraData);
    if (success) setIsLoading(false); // ログイン時は即座にロード完了させる
    return success;
  }, [setSession]);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userStatus');
    setUser(null);
    setToken(null);
    window.location.href = '/';
  }, []);

  const register = useCallback(async (email, password, handleName) => {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, handleName }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '登録に失敗しました。');
    }
    return response.json();
  }, []);

  const updateUser = useCallback((newUserData) => {
    setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...newUserData };
        if (typeof window !== 'undefined' && newUserData.status) {
            localStorage.setItem('userStatus', newUserData.status);
        }
        return updated;
    });
  }, []);

  const contextValue = useMemo(() => {
    const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
    // 重要: ロード中は絶対にリダイレクトさせないために true を返す
    const approved = isLoading ? true : (user ? (user.status === 'APPROVED' || !isProfessional) : false);

    return {
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === 'ADMIN',
      isProfessional,
      isApproved: approved,
      isPending: user?.status === 'PENDING',
      login,
      logout,
      register,
      updateUser,
      authenticatedFetch
    };
  }, [user, token, isLoading, login, logout, register, updateUser, authenticatedFetch]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);