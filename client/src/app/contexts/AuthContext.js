'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // トークンを解析するライブラリ

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ★ ユーザー情報をセットする共通関数
  const setupUser = (newToken) => {
    try {
      const decodedUser = jwtDecode(newToken);
      // ★ iconUrl も user ステートに含める
      setUser({ 
        id: decodedUser.id,
        email: decodedUser.email,
        handleName: decodedUser.handleName,
        role: decodedUser.role,
        iconUrl: decodedUser.iconUrl, // ★ 追加
        referralCode: decodedUser.referralCode,
        sub: decodedUser.sub 
      });
      setToken(newToken);
      localStorage.setItem('authToken', newToken);
    } catch (error) {
      console.error("Failed to decode token:", error);
      // トークンデコード失敗時はログアウト
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    }
  };

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setupUser(storedToken); // ★ 共通関数でセットアップ
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newToken) => {
    setupUser(newToken); // ★ 共通関数でセットアップ
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };
  
  const register = async (email, password, handleName) => {
    // ... (変更なし)
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, handleName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '登録に失敗しました。');
    }
    return response.json();
  };

  // ★ valueの中に `login` を含める（プロフ更新時に新しいトークンをセットするため）
  const authInfo = { user, token, login, logout, register, isAuthenticated: !!user, loading };


  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);