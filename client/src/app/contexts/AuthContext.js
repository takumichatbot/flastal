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
  const pathname = usePathname();

  const parseUserFromToken = useCallback((rawToken) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined' || rawToken === '') return null;
    
    try {
      const cleanToken = rawToken.toString().replace(/['"]+/g, '').trim();
      const decoded = jwtDecode(cleanToken);

      if (decoded.exp * 1000 < Date.now()) {
        return null;
      }

      let displayName = decoded.handleName;
      if (decoded.role === 'FLORIST') displayName = decoded.shopName || decoded.handleName;
      if (decoded.role === 'VENUE') displayName = decoded.venueName || decoded.handleName;
      if (decoded.role === 'ORGANIZER') displayName = decoded.name || decoded.handleName;

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        handleName: displayName,
        iconUrl: decoded.iconUrl,
        shopName: decoded.shopName,
        venueName: decoded.venueName,
        status: decoded.status || 'APPROVED',
        sub: decoded.sub,
        _token: cleanToken 
      };
    } catch (error) {
      console.error("Auth: Token decode failed", error);
      return null;
    }
  }, []);

  const setSession = useCallback((newToken) => {
    const userData = parseUserFromToken(newToken);

    if (userData) {
      setUser(userData);
      setToken(userData._token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', userData._token);
      }
      return true;
    } else {
      setUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      return false;
    }
  }, [parseUserFromToken]);

  // 認証付き fetch ヘルパー
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // トークンが無効な場合はログアウト
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        window.location.href = '/login';
      }
    }

    return response;
  }, []);

  useEffect(() => {
    const initAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('authToken');
          if (storedToken) {
            setSession(storedToken);
          }
        }
      } catch (e) {
        console.error("Auth: Initialization failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [setSession]);

  const login = useCallback(async (newToken) => {
    const result = setSession(newToken);
    return result;
  }, [setSession]);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;

    const currentRole = user?.role;
    let redirectPath = '/';
    if (currentRole === 'FLORIST') redirectPath = '/florists/login';
    else if (currentRole === 'ADMIN') redirectPath = '/admin/login';
    else redirectPath = '/login';

    localStorage.clear();
    setUser(null);
    setToken(null);

    toast.success('ログアウトしました');
    window.location.href = redirectPath;
  }, [user]);

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
    setUser(prev => (prev ? { ...prev, ...newUserData } : null));
  }, []);

  const contextValue = useMemo(() => {
    const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
    const approved = user ? (user.status === 'APPROVED' || !isProfessional) : false;

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