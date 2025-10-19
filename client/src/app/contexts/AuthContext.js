'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // トークンを解析するライブラリ

// バックエンドAPIのURL（.env.localファイルで管理するのが望ましい）
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decodedUser = jwtDecode(storedToken);
        setUser({ email: decodedUser.sub, ...decodedUser });
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newToken) => {
    try {
      const decodedUser = jwtDecode(newToken);
      setUser({ email: decodedUser.sub, ...decodedUser });
      setToken(newToken);
      localStorage.setItem('authToken', newToken);
    } catch (error) {
      console.error("Failed to process login:", error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };
  
  // ★★★ ここからが追加されたregister関数です ★★★
  const register = async (email, password, handleName) => {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, handleName }),
    });

    if (!response.ok) {
      // サーバーから返されたエラーメッセージを取得してスローする
      const errorData = await response.json();
      throw new Error(errorData.message || '登録に失敗しました。');
    }
    // 成功した場合は、レスポンスデータを返す (今回は使わないが将来のために)
    return response.json();
  };
  // ★★★ 追加はここまで ★★★

  // ★ valueの中に `register` を追加
  const authInfo = { user, token, login, logout, register, isAuthenticated: !!user };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
