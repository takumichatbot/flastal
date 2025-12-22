'use server'

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto'; // Node.js標準モジュール

// S3クライアントの初期化
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 許可するMIMEタイプ
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// ファイルサイズ制限 (例: 5MB - ここでは署名付きURL発行時のメタデータとして利用想定)
const MAX_FILE_SIZE = 5 * 1024 * 1024; 

/**
 * 1. アップロード用の署名付きURLを発行する関数
 * @param {string} fileName - 元のファイル名
 * @param {string} fileType - MIMEタイプ
 * @param {number} fileSize - ファイルサイズ(byte)
 */
export async function getPresignedUrl(fileName, fileType, fileSize) {
  try {
    // バリデーション
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return { success: false, error: '許可されていないファイル形式です (JPEG, PNG, WEBP, GIFのみ)。' };
    }
    if (fileSize > MAX_FILE_SIZE) {
      return { success: false, error: 'ファイルサイズが大きすぎます (5MB以下)。' };
    }
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not configured.');
    }

    // ファイル名の生成: uploads/{uuid}.{ext} の形式で整理
    const ext = fileName.split('.').pop();
    const uniqueId = randomUUID();
    const key = `uploads/${uniqueId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      // 必要に応じてメタデータを追加可能
      // Metadata: { userId: '...' }, 
    });

    // 60秒有効なURLを発行
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    
    // 公開URLの構築 (CloudFrontを使用している場合はそのドメインに変更してください)
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { 
      success: true, 
      uploadUrl, 
      publicUrl 
    };

  } catch (error) {
    console.error("S3 Presigned URL Error:", error);
    return { success: false, error: 'アップロードURLの発行に失敗しました。' };
  }
}

/**
 * 2. アップロード完了後にDBに保存する関数
 * @param {Object} formData - フォームデータ
 * @param {string} imageUrl - アップロードされた画像のURL
 */
export async function savePostToDb(formData, imageUrl) {
  try {
    // 入力値の取得と簡易バリデーション
    const eventName = formData.eventName?.trim();
    const senderName = formData.senderName?.trim();

    if (!eventName || !imageUrl) {
      return { success: false, error: 'イベント名と画像は必須です。' };
    }

    // DB保存
    const newPost = await prisma.post.create({
      data: {
        eventName: eventName,
        senderName: senderName || '匿名', // 名前がない場合は匿名
        imageUrl: imageUrl,
        // userRelationなどがスキーマにある場合、ここで紐付け
        // userId: formData.userId 
      },
    });

    // フロントエンドでのキャッシュ更新のため、必要なら revalidatePath を呼ぶ
    // import { revalidatePath } from 'next/cache';
    // revalidatePath('/posts'); 

    return { success: true, data: newPost };

  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: 'データベースへの保存に失敗しました。' };
  }
}