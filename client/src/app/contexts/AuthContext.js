// src/app/contexts/AuthContext.js

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★★★ 修正: AuthContext の初期値に新しいフィールドを追加 ★★★
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isApproved: true, // 一般ユーザーは常に true とみなす
  isPending: false,
  isProfessional: false,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  register: () => {},
});
// ★★★ --------------------------------------------------- ★★★


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ★ ユーザー情報をセットする共通関数
  const setupUser = (newToken) => {
    if (!newToken) return false;

    // ★★★ 修正: "null" や "undefined" という文字列を除外する ★★★
    let rawToken = newToken.replace(/^"|"$/g, '');
    if (rawToken === 'null' || rawToken === 'undefined' || rawToken === '') {
      logout(); // 無効なトークンならログアウト処理へ
      return false;
    }

    try {
      const decoded = jwtDecode(rawToken);
      
      let displayName = decoded.handleName;
      if (decoded.role === 'FLORIST') displayName = decoded.shopName;
      if (decoded.role === 'VENUE') displayName = decoded.venueName;

      // ★★★ 修正: status フィールドを追加 ★★★
      setUser({ 
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        handleName: displayName,
        iconUrl: decoded.iconUrl,
        referralCode: decoded.referralCode,
        shopName: decoded.shopName,
        venueName: decoded.venueName,
        status: decoded.status, // ← status を追加
        sub: decoded.sub 
      });
      // ★★★ ---------------------------- ★★★
      
      setToken(rawToken);
      localStorage.setItem('authToken', rawToken); // ★ きれいなトークンを保存
      return true;
    } catch (error) {
      console.error("Failed to decode token:", error);
      // ★ ログアウト時に router.push が実行されるため、ここでは実行しない
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
    localStorage.removeItem('flastal-florist');
    router.push('/florists/login'); // ログインページへ強制移動
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

  // ★★★ 修正: 新しい認証情報ヘルパーを追加 ★★★
  const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
  
  // プロフェッショナルで status が APPROVED の場合のみ承認済み
  // 一般ユーザー (USER) は isProfessional=false なので、isApproved は常に true
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
    
    // ★★★ 追加した情報 ★★★
    isProfessional, 
    isApproved, 
    isPending,
    // (REJECTEDの場合は isApproved=false, isPending=false となる)
    // ★★★ ---------------- ★★★
  };
  // ★★★ -------------------------------------- ★★★


  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);