'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // トークンを解析するライブラリ

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // ★ 認証状態の確認中を示す

  useEffect(() => {
    // ★★★ アプリケーション起動時に一度だけ実行 ★★★
    // localStorageに保存されているトークンを探し、有効なら自動ログインする
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        // ここではトークンの有効期限チェックなども将来的に追加できます
        const decodedUser = jwtDecode(storedToken); // トークンからユーザー情報を復元
        setUser({ email: decodedUser.sub, ...decodedUser }); // ユーザー情報をセット
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      // エラーがあればクリアする
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false); // 確認完了
    }
  }, []);

  // ★★★ ログイン時に呼び出す関数 ★★★
  const login = (newToken) => {
    try {
      const decodedUser = jwtDecode(newToken);
      setUser({ email: decodedUser.sub, ...decodedUser });
      setToken(newToken);
      // ★★★ 最重要: トークンをlocalStorageに保存する ★★★
      localStorage.setItem('authToken', newToken);
    } catch (error) {
      console.error("Failed to process login:", error);
    }
  };

  // ★★★ ログアウト時に呼び出す関数 ★★★
  const logout = () => {
    setUser(null);
    setToken(null);
    // ★★★ 最重要: localStorageからトークンを削除する ★★★
    localStorage.removeItem('authToken');
  };

  const authInfo = { user, token, login, logout, isAuthenticated: !!user };

  // 認証状態の確認が終わるまで何も表示しない（ちらつき防止）
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