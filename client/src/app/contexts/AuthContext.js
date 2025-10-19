'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// jwt-decodeはNode.jsバックエンドでは不要
// import { jwtDecode } from 'jwt-decode'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ★★★ 修正: 'authToken'(JWT) ではなく 'flastal-user'(ユーザー情報) を読む
    try {
      const storedUser = localStorage.getItem('flastal-user');
      if (storedUser) {
        const userObject = JSON.parse(storedUser);
        setUser(userObject); // ユーザー情報をセット
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      localStorage.removeItem('flastal-user'); // エラーがあればクリア
    } finally {
      setLoading(false);
    }
  }, []);

  // ★★★ 修正: 'token' ではなく 'userObject' を受け取る ★★★
  const login = (userObject) => {
    try {
      setUser(userObject); // 1. ReactのStateを更新
      // 2. localStorageに 'flastal-user' として保存
      localStorage.setItem('flastal-user', JSON.stringify(userObject));
    } catch (error) {
      console.error("Failed to process login:", error);
    }
  };

  const logout = () => {
    setUser(null);
    // ★★★ 修正: 'authToken' ではなく 'flastal-user' を削除 ★★★
    localStorage.removeItem('flastal-user');
    // ログアウト時にログインページへリダイレクト
    window.location.href = '/login';
  };

  // ★ (前回追加した) register関数はそのまま
  const register = async (email, password, handleName) => {
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
  
  // ★ 渡すvalueを修正 (tokenを削除)
  const authInfo = { user, login, logout, register, isAuthenticated: !!user };

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