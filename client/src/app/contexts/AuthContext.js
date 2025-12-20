// src/app/contexts/AuthContext.js

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isApproved: true,
  isPending: false,
  isProfessional: false,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  register: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ★ 修正1: 依存関係ループを防ぐため useCallback でラップ
  // ★ 修正2: この関数内では router.push (リダイレクト) をしない
  const setupUser = useCallback((newToken) => {
    if (!newToken) return false;

    // 文字列の "null" や "undefined" をクリーニング
    let rawToken = newToken.replace(/^"|"$/g, '');

    // トークンが無効な値の場合
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined') {
      // ここではリダイレクトせず、ストレージを掃除してfalseを返すだけにする
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      return false;
    }

    try {
      const decoded = jwtDecode(rawToken);
      
      // 有効期限切れチェック (decoded.exp は秒単位)
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        console.warn("Token expired");
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        return false;
      }

      let displayName = decoded.handleName;
      if (decoded.role === 'FLORIST') displayName = decoded.shopName;
      if (decoded.role === 'VENUE') displayName = decoded.venueName;

      setUser({ 
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        handleName: displayName,
        iconUrl: decoded.iconUrl,
        referralCode: decoded.referralCode,
        shopName: decoded.shopName,
        venueName: decoded.venueName,
        status: decoded.status,
        sub: decoded.sub 
      });
      
      setToken(rawToken);
      localStorage.setItem('authToken', rawToken);
      return true;

    } catch (error) {
      console.error("Failed to decode token:", error);
      // デコード失敗時もリダイレクトせず、ログアウト状態にするだけ
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  // ★ 修正3: 初期化ロジック
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          setupUser(storedToken);
        }
      } catch (error) {
        console.error("Auth init failed:", error);
      } finally {
        // ★ ここが最も重要：何があっても必ず loading を false にする
        setLoading(false);
      }
    };

    initAuth();
  }, [setupUser]);

  const login = async (newToken, userData = null) => {
    const success = setupUser(newToken);
    if (success && userData) {
      // 必要ならuserDataのマージ処理
    }
  };

  // 手動ログアウト時はリダイレクトしても良い
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('flastal-florist');
    
    // 現在のページが認証が必要なページならリダイレクト、そうでなければトップへ
    // ここでは安全のため一律ログイン画面、またはトップページへ
    router.push('/florists/login'); 
  }, [router]);
  
  const register = async (email, password, handleName) => {
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
  };

  const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
  const isApproved = isProfessional ? user.status === 'APPROVED' : true; 
  const isPending = isProfessional ? user.status === 'PENDING' : false;

  const authInfo = { 
    user, 
    token, 
    login, 
    logout, 
    register, 
    isAuthenticated: !!user, 
    loading,
    isProfessional, 
    isApproved, 
    isPending,
  };

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);