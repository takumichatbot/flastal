'use server'

import { cookies } from 'next/headers';

// バックエンドのURL (環境変数から取得)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * 1. 署名付きURLの発行
 * バックエンドの既存API (/api/tools/s3-upload-url) を利用
 */
export async function getPresignedUrl(fileName, fileType, fileSize) {
  // 認証トークンの取得 (CookieやHeaderから)
  // ※ここでは簡易的にクライアントから送られてくることを想定、もしくはServer Component内でCookie取得
  // クライアント側で authenticatedFetch を使って直接 /api/tools/... を呼ぶ方が安全ですが、
  // Server Action経由にするなら以下のようにトークンリレーが必要です。
  
  // ★推奨: ファイルアップロード前の署名取得は、クライアントコンポーネント(UploadForm.js)から
  // useAuth() の authenticatedFetch を使って直接バックエンドを叩く方が設計として綺麗です。
  // そのため、この関数は削除し、UploadForm.js側を修正することを強く推奨します。
  
  return { error: 'この関数は廃止されました。クライアントから直接APIを呼んでください。' };
}

/**
 * 2. 投稿データの保存
 * バックエンドの新API (/api/posts) を利用
 */
export async function savePostToDb(formData, imageUrl, userEmail) {
  try {
    // サーバーサイドでのFetch
    const res = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 必要に応じて認証ヘッダーを追加 (Server Actions内でCookieからトークンを取り出す処理が必要)
      },
      body: JSON.stringify({
        eventName: formData.eventName,
        senderName: formData.senderName,
        imageUrl: imageUrl,
        email: userEmail
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || '保存に失敗しました');
    }

    const data = await res.json();
    return { success: true, data };

  } catch (error) {
    console.error("Server Action Error:", error);
    return { success: false, error: 'サーバーへの接続に失敗しました。' };
  }
}