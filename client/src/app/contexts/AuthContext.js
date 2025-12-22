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
  // 権限・ステータスフラグ
  isAdmin: false,
  isProfessional: false, // 花屋・会場・主催者など
  isApproved: false,     // 審査承認済みか
  isPending: false,      // 審査待ちか
  // アクション
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateUser: () => {}, // ユーザー情報の部分更新用
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // --- ヘルパー: トークンからユーザー情報を抽出 ---
  const parseUserFromToken = useCallback((rawToken) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined') return null;
    
    try {
      // 余計なクォートを除去
      const cleanToken = rawToken.replace(/^"|"$/g, '');
      const decoded = jwtDecode(cleanToken);

      // 有効期限チェック (expは秒単位)
      if (decoded.exp * 1000 < Date.now()) {
        console.warn("[Auth] Token expired");
        return null;
      }

      // 表示名の決定ロジック
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
        status: decoded.status, // PENDING, APPROVED, REJECTED
        sub: decoded.sub,
        // トークン自体もユーザーオブジェクトに含めておく（便利機能）
        _token: cleanToken 
      };
    } catch (error) {
      console.error("[Auth] Token decode failed:", error);
      return null;
    }
  }, []);

  // --- メイン: ユーザー設定処理 ---
  const setSession = useCallback((newToken) => {
    const userData = parseUserFromToken(newToken);

    if (userData) {
      setUser(userData);
      setToken(userData._token);
      localStorage.setItem('authToken', userData._token);
      return true;
    } else {
      // 無効なトークンならクリア
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      return false;
    }
  }, [parseUserFromToken]);

  // --- 初期化ロジック ---
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setSession(storedToken);
      }
      setIsLoading(false);
    };
    initAuth();
  }, [setSession]);

  // --- アクション: ログイン ---
  const login = async (newToken) => {
    const success = setSession(newToken);
    if (success) {
      // ログイン成功時のトーストなどは呼び出し元で行うか、ここで出す
      // toast.success('ログインしました'); 
    }
    return success;
  };

  // --- アクション: ログアウト (Smart Redirect) ---
  const logout = useCallback(() => {
    const currentRole = user?.role;
    
    // ステートクリア
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('flastal-florist'); // 旧仕様のゴミ掃除

    // ロールに基づいたリダイレクト先決定
    let redirectPath = '/login';
    if (currentRole === 'FLORIST') redirectPath = '/florists/login';
    else if (currentRole === 'VENUE') redirectPath = '/venues/login'; // 仮
    else if (currentRole === 'ADMIN') redirectPath = '/admin/login'; // 仮

    toast.success('ログアウトしました');
    router.push(redirectPath);
  }, [user, router]);

  // --- アクション: 新規登録 ---
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

  // --- アクション: ユーザー情報の部分更新 ---
  // (マイページでアイコン変更などをした際に、再ログインなしで反映させる)
  const updateUser = useCallback((newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  }, []);

  // --- 計算プロパティ (Computed Properties) ---
  const contextValue = useMemo(() => {
    const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
    
    return {
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      
      // 権限フラグ
      isAdmin: user?.role === 'ADMIN',
      isProfessional,
      isApproved: isProfessional ? user.status === 'APPROVED' : true, // 一般ユーザーは常に承認済み扱い
      isPending: isProfessional ? user.status === 'PENDING' : false,
      
      // メソッド
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