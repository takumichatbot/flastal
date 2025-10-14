'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// APIサーバーのURL
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'http://127.0.0.1:8000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'USER', 'FLORIST' など
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async (token) => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // Pythonバックエンドから返されるUserモデルの全情報を受け取る
        setUser(userData);
        setUserType('USER'); // 今は 'USER' に固定
      } else {
        // トークンが無効な場合
        localStorage.removeItem('accessToken');
        setUser(null);
        setUserType(null);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetchUser(token);
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access_token);
        await fetchUser(data.access_token);
        router.push('/mypage');
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error("Login failed:", error);
      // エラーを再スローして呼び出し元に伝える
      throw error;
    }
  };
  
  const register = async (email, password, handleName) => {
    const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, handleName }), // handleNameも送信
    });

    if (response.ok) {
        return true;
    } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '新規登録に失敗しました');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setUserType(null);
    router.push('/login');
  };

  const value = { user, userType, login, register, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);