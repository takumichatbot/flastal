'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const BASE_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  isProfessional: false,
  isApproved: false,
  isPending: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateUser: () => {},
  authenticatedFetch: async () => {},
  refreshAccessToken: async () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializing = useRef(true);
  const requestDebounce = useRef({});
  // stateのtokenはクロージャに古い値が残るため、fetch時は常にrefから最新値を読む
  const tokenRef = useRef(null);
  // 並行401時にrefreshが多重実行されるのを防ぐ（リフレッシュトークンは使い捨てのため多重実行は即セッション破棄につながる）
  const refreshPromiseRef = useRef(null);
  const router = useRouter();

  const applyToken = useCallback((newToken) => {
    tokenRef.current = newToken;
    setToken(newToken);
    if (typeof window !== 'undefined') window.__flastalToken = newToken;
  }, []);

  const parseUserFromToken = useCallback((rawToken, extraData = null) => {
    if (!rawToken || rawToken === 'null' || rawToken === 'undefined' || rawToken === '') return null;
    try {
      const cleanToken = rawToken.toString().replace(/['"]+/g, '').trim();
      const decoded = jwtDecode(cleanToken);
      if (decoded.exp * 1000 < Date.now()) return null;

      // extraData (最新のプロフィール情報) を優先
      const role = extraData?.role || decoded.role;
      // マルチロール対応: JWTのrolesとextraData.roles(DB値)をマージ
      // ADMINユーザーはJWTにroles:['ADMIN']しか入らないが、DBにはILLUSTRATOR等が入るため両方を合成する
      const jwtRoles = decoded.roles?.length ? decoded.roles : [role];
      const extraRoles = Array.isArray(extraData?.roles) ? extraData.roles : [];
      const roles = extraRoles.length
        ? Array.from(new Set([...jwtRoles, ...extraRoles]))
        : jwtRoles;
      const venueName = extraData?.venueName || decoded.venueName;
      const shopName = extraData?.shopName || decoded.shopName;
      const platformName = extraData?.platformName || decoded.platformName; // 追加
      const handleName = extraData?.handleName || decoded.handleName;
      const iconUrl = extraData?.iconUrl || decoded.iconUrl; // 追加: アイコンも優先

      return {
        id: extraData?.id || decoded.id,
        email: extraData?.email || decoded.email,
        role: role,
        roles: roles,
        handleName: handleName,
        platformName: platformName, 
        iconUrl: iconUrl,
        shopName: shopName,
        venueName: venueName,
        status: extraData?.status || decoded.status || 'APPROVED',
        points: extraData?.points || 0,                 // 🌟 追加：ポイント
        supportLevel: extraData?.supportLevel || 'Fan', // 🌟 追加：応援ランク
        referralCode: extraData?.referralCode || '',    // 🌟 追加：招待コード
        sub: decoded.sub,
        _token: cleanToken 
      };
    } catch (error) {
      return null;
    }
  }, []);

  const setSession = useCallback((newToken, extraData = null, newRefreshToken = null) => {
    const userData = parseUserFromToken(newToken, extraData);
    if (userData) {
      setUser(userData);
      // アクセストークンはメモリ（state/ref）のみに保存。localStorageには書かない
      applyToken(userData._token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('flastal-user-cache', JSON.stringify(extraData || {}));
        if (newRefreshToken) {
          localStorage.setItem('flastal-refresh-token', newRefreshToken);
        }
      }
      return true;
    } else {
      if (!isInitializing.current) {
        setUser(null);
        applyToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('flastal-user-cache');
          localStorage.removeItem('flastal-refresh-token');
          localStorage.removeItem('userStatus');
        }
      }
      return false;
    }
  }, [parseUserFromToken, applyToken]);

  const refreshAccessToken = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    // 進行中のrefreshがあればそれを待つ（多重実行するとローテーション済みトークンで401になりセッションが飛ぶ）
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doRefresh = async () => {
      const rt = localStorage.getItem('flastal-refresh-token');
      if (!rt) return null;

      try {
        const res = await fetch(`${BASE_BACKEND_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });

        if (!res.ok) {
          // 401/403（トークン無効・失効）のときだけセッションを破棄する。
          // 429や5xx等の一時的な失敗でログアウトさせない
          if (res.status === 401 || res.status === 403) {
            setUser(null);
            applyToken(null);
            localStorage.removeItem('flastal-user-cache');
            localStorage.removeItem('flastal-refresh-token');
            localStorage.removeItem('userStatus');
            // 起動時のサイレント再認証では従来どおりトーストを出さない
            if (!isInitializing.current) {
              toast.error('セッションが切れました。再度ログインしてください。', { id: 'session-expired' });
            }
          }
          return null;
        }

        const data = await res.json();
        const cleanToken = data.token.replace(/['"]+/g, '').trim();
        // アクセストークンはメモリ（state/ref）のみに保存
        if (data.refreshToken) {
          localStorage.setItem('flastal-refresh-token', data.refreshToken);
        }
        applyToken(cleanToken);
        return cleanToken;
      } catch {
        return null;
      }
    };

    refreshPromiseRef.current = doRefresh().finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  }, [applyToken]);

  const authenticatedFetch = useCallback(async (url, options = {}, retryCount = 0) => {
    let finalUrl = url;
    if (!url.startsWith('http')) {
      const parts = url.split('?');
      let apiPath = parts[0].replace(/^\/+/, '/');
      if (!apiPath.startsWith('/api/')) {
        apiPath = `/api${apiPath}`;
      }
      const query = parts[1] ? `?${parts[1]}` : '';
      finalUrl = `${BASE_BACKEND_URL}${apiPath}${query}`;
    }

    const now = Date.now();
    const requestKey = `${finalUrl}-${options.method || 'GET'}`;
    if (requestDebounce.current[requestKey] && (now - requestDebounce.current[requestKey] < 50)) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    requestDebounce.current[requestKey] = now;

    // アクセストークンはrefから取得（stateだとrefresh直後のリトライでクロージャ内の古いトークンを掴むため）
    let currentToken = tokenRef.current;

    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (currentToken) {
      const cleanToken = currentToken.replace(/['"]+/g, '').trim();
      if (cleanToken && cleanToken !== 'null' && cleanToken !== 'undefined') {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }

    try {
      const response = await fetch(finalUrl, {
        ...options,
        headers,
        mode: 'cors'
      });

      if (response.status === 401 && retryCount < 1 && !finalUrl.includes('/login') && !finalUrl.includes('/refresh')) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return authenticatedFetch(url, options, retryCount + 1);
        }
        return response;
      }
      return response;
    } catch (e) {
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return authenticatedFetch(url, options, retryCount + 1);
      }
      throw e;
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    // アクセストークンはメモリ管理のためページリロード時は再取得が必要。
    // リフレッシュトークンが残っていれば /api/auth/refresh でサイレント再取得する。
    const initAuth = async () => {
      try {
        if (typeof window === 'undefined') return;

        // 旧バージョンの localStorage に残ったアクセストークンを削除（移行クリーンアップ）
        localStorage.removeItem('authToken');
        localStorage.removeItem('flastal-token');

        const storedRefreshToken = localStorage.getItem('flastal-refresh-token');
        if (!storedRefreshToken) return;

        // リフレッシュトークンを使ってアクセストークンをサイレント取得。
        // 初期化中に他のfetchが401を踏んでも多重refreshにならないよう、single-flightの共通経路を使う
        const cleanToken = await refreshAccessToken();
        if (!cleanToken) {
          // 認証失敗（リフレッシュトークン破棄済み）のときだけキャッシュを消す。
          // ネットワークエラー等の一時的な失敗ではキャッシュを保持する
          if (!localStorage.getItem('flastal-refresh-token')) {
            localStorage.removeItem('flastal-user-cache');
            localStorage.removeItem('userStatus');
          }
          return;
        }

        // サーバーから最新のユーザー情報（roles等）を取得してキャッシュより優先する
        let extraData = {};
        try {
          const meRes = await fetch(`${BASE_BACKEND_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${cleanToken}` },
          });
          if (meRes.ok) {
            extraData = await meRes.json();
            localStorage.setItem('flastal-user-cache', JSON.stringify(extraData));
          } else {
            // APIが失敗した場合はキャッシュにフォールバック
            const storedCache = localStorage.getItem('flastal-user-cache');
            const storedVenue = localStorage.getItem('flastal-venue');
            if (storedCache) {
              try { extraData = JSON.parse(storedCache) || {}; } catch (e) { localStorage.removeItem('flastal-user-cache'); }
            } else if (storedVenue) {
              try { extraData = JSON.parse(storedVenue) || {}; } catch (e) { localStorage.removeItem('flastal-venue'); }
            }
          }
        } catch (e) {
          // ネットワークエラー時はキャッシュにフォールバック
          const storedCache = localStorage.getItem('flastal-user-cache');
          if (storedCache) {
            try { extraData = JSON.parse(storedCache) || {}; } catch (_) { localStorage.removeItem('flastal-user-cache'); }
          }
        }

        setSession(cleanToken, extraData, null);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          isInitializing.current = false;
        }, 500);
      }
    };
    initAuth();
  }, [setSession, refreshAccessToken]);

  const login = useCallback(async (newToken, extraData = null, newRefreshToken = null) => {
    isInitializing.current = false;
    const res = setSession(newToken, extraData, newRefreshToken);
    if (res) setIsLoading(false);
    return res;
  }, [setSession]);

  const logout = useCallback(() => {
    isInitializing.current = false;
    if (typeof window === 'undefined') return;
    const rt = localStorage.getItem('flastal-refresh-token');
    if (rt) {
      fetch(`${BASE_BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => {});
    }
    localStorage.removeItem('flastal-user-cache');
    localStorage.removeItem('flastal-refresh-token');
    localStorage.removeItem('flastal-venue');
    localStorage.removeItem('userStatus');
    setUser(null);
    applyToken(null);
    router.push('/');
  }, [router, applyToken]);

  // ★修正: 更新時にローカルストレージも更新する
  const updateUser = useCallback((newUserData) => {
    setUser(prev => {
        const updated = prev ? { ...prev, ...newUserData } : null;
        if (updated && typeof window !== 'undefined') {
             // 既存のキャッシュとマージして保存
             const currentCache = localStorage.getItem('flastal-user-cache');
             let parsedCache = {};
             try {
                 parsedCache = currentCache ? JSON.parse(currentCache) : null;
                 if (!parsedCache) parsedCache = {};
             } catch (e) {
                 console.warn('[AuthContext] キャッシュパースエラー:', e.message);
                 localStorage.removeItem('flastal-user-cache');
                 parsedCache = {};
             }
             localStorage.setItem('flastal-user-cache', JSON.stringify({ ...parsedCache, ...newUserData }));
        }
        return updated;
    });
  }, []);

  const register = useCallback(async (email, password, handleName, referralCode = '') => {
    const response = await fetch(`${BASE_BACKEND_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, handleName, referralCode }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '登録に失敗しました。');
    return data;
  }, []);

  const contextValue = useMemo(() => {
    const isProfessional = user && ['FLORIST', 'VENUE', 'ORGANIZER'].includes(user.role);
    const approved = isLoading ? true : (user ? (user.status === 'APPROVED' || !isProfessional) : false);
    return {
      user, token, isAuthenticated: !!user, isLoading,
      isAdmin: user?.role === 'ADMIN',
      isProfessional, isApproved: approved,
      isPending: user?.status === 'PENDING',
      login, logout, updateUser, register, authenticatedFetch, refreshAccessToken,
      fetchUser: async () => {}
    };
  }, [user, token, isLoading, login, logout, updateUser, register, authenticatedFetch, refreshAccessToken]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);