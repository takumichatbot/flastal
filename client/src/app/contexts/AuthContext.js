'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  
  const router = useRouter();

  // トークンからユーザー情報を抽出する純粋な関数
  const parseUserFromToken = useCallback((rawToken, extraData = null) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined' || rawToken === '') return null;
    
    try {
      const cleanToken = rawToken.toString().replace(/['"]+/g, '').trim();
      const decoded = jwtDecode(cleanToken);

      // 有効期限切れチェック
      if (decoded.exp * 1000 < Date.now()) {
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
      console.error("Auth: Decode failed", error);
      return null;
    }
  }, []);

  // セッションをセットする関数。初期化時は remove を行わないようにフラグを追加
  const setSession = useCallback((newToken, extraData = null, isInitializing = false) => {
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
      // 初期化中（ページ読み込み時）は、デコードに失敗しても即座に消さない（一瞬のラグ対策）
      if (!isInitializing) {
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
    const initAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('authToken');
          if (storedToken && storedToken !== 'null') {
            const storedStatus = localStorage.getItem('userStatus');
            // isInitializing = true で呼び出し
            setSession(storedToken, storedStatus ? { status: storedStatus } : null, true);
          }
        }
      } catch (e) {
        console.error("Auth: Init failed", e);
      } finally {
        // ステートが反映される時間を十分に確保
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    initAuth();
  }, [setSession]);

  const login = useCallback(async (newToken, extraData = null) => {
    const result = setSession(newToken, extraData, false);
    if (result) setIsLoading(false);
    return result;
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
    // ロード中はガード機能を絶対に発動させない
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