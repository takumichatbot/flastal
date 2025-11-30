'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ★ ユーザー情報をセットする共通関数 (さらに改良版)
  const setupUser = (newToken) => {
    if (!newToken) return false;

    // ★★★ 修正ポイント: トークンのクリーニング ★★★
    // 余計なダブルクォーテーションを取り除く
    const rawToken = newToken.replace(/^"|"$/g, '');

    try {
      const decoded = jwtDecode(rawToken);
      
      // 役割に応じて「表示名」を統一的に handleName にセットする
      let displayName = decoded.handleName;
      if (decoded.role === 'FLORIST') displayName = decoded.shopName;
      if (decoded.role === 'VENUE') displayName = decoded.venueName;

      setUser({ 
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        handleName: displayName, // フロントエンドの表示用
        iconUrl: decoded.iconUrl,
        referralCode: decoded.referralCode,
        // 元のフィールドも保持しておく
        shopName: decoded.shopName,
        venueName: decoded.venueName,
        sub: decoded.sub 
      });
      
      setToken(rawToken);
      localStorage.setItem('authToken', rawToken); // ★ きれいなトークンを保存
      return true;
    } catch (error) {
      console.error("Failed to decode token:", error);
      // トークンが無効なら強制ログアウト（無限ループ防止のため、ここではrouter.pushしない）
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      return false;
    }
  };

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
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (newToken, userData = null) => {
    const success = setupUser(newToken);
    if (success && userData) {
      // 必要ならuserDataをマージ
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('flastal-florist'); // 古いキーの掃除
    router.push('/login');
  };
  
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

  const authInfo = { user, token, login, logout, register, isAuthenticated: !!user, loading };

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);