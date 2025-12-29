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
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  /**
   * トークンからユーザー情報を抽出する関数
   * 引用符などを徹底的に排除するように強化
   */
  const parseUserFromToken = useCallback((rawToken) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined' || rawToken === '') return null;
    
    try {
      // 全ての種類の引用符を完全に削除し、空白も除去
      const cleanToken = rawToken.toString().replace(/['"]+/g, '').trim();
      const decoded = jwtDecode(cleanToken);

      // 有効期限チェック
      if (decoded.exp * 1000 < Date.now()) {
        console.warn("Auth: Token has expired");
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
        status: decoded.status || 'APPROVED', // statusがない場合はデフォルトでAPPROVEDとする
        sub: decoded.sub,
        _token: cleanToken 
      };
    } catch (error) {
      console.error("Auth: Token decode failed", error);
      return null;
    }
  }, []);

  /**
   * セッションを確立する関数
   */
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
        localStorage.removeItem('flastal-florist');
      }
      return false;
    }
  }, [parseUserFromToken]);

  /**
   * 初期起動時の認証チェック
   */
  useEffect(() => {
    setIsMounted(true);
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

  /**
   * ログイン実行
   */
  const login = useCallback(async (newToken) => {
    return setSession(newToken);
  }, [setSession]);

  /**
   * ログアウト処理
   */
  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. まずリダイレクト先を決める
    const currentRole = user?.role;
    let redirectPath = '/';
    if (currentRole === 'FLORIST') redirectPath = '/florists/login';
    else if (currentRole === 'ADMIN') redirectPath = '/admin/login';
    else redirectPath = '/login';

    // 2. 状態とストレージをクリア
    setUser(null);
    setToken(null);
    localStorage.clear(); // 全てクリアして不整合を防ぐ

    toast.success('ログアウトしました');

    // 3. window.location.replace で強制的にページをリロードして遷移
    // これによりNext.jsのステート競合によるクラッシュを完全に防ぐ
    window.location.replace(redirectPath);
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
    const approved = user ? (user.status === 'APPROVED') : false;
    
    return {
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === 'ADMIN',
      isProfessional,
      isApproved: isProfessional ? approved : true,
      isPending: isProfessional ? user.status === 'PENDING' : false,
      login,
      logout,
      register,
      updateUser
    };
  }, [user, token, isLoading, login, logout, register, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);