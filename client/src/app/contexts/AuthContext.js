// client/src/app/contexts/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'USER', 'FLORIST', 'VENUE'

  // ページ読み込み時に、前回ログインした情報が残っていれば復元する
  useEffect(() => {
    const storedUser = localStorage.getItem('flastal-user');
    const storedUserType = localStorage.getItem('flastal-userType');
    if (storedUser && storedUserType) {
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType);
    }
  }, []);

  const login = (userData, type) => {
    setUser(userData);
    setUserType(type);
    localStorage.setItem('flastal-user', JSON.stringify(userData));
    localStorage.setItem('flastal-userType', type);
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('flastal-user');
    localStorage.removeItem('flastal-userType');
  };

  return (
    <AuthContext.Provider value={{ user, userType, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 他のコンポーネントから簡単にContextを呼び出すためのカスタムフック
export function useAuth() {
  return useContext(AuthContext);
}