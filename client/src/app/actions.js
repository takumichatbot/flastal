'use server'

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// prismaもここでインポート
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 1. アップロード用の署名付きURLを発行する関数
export async function getPresignedUrl(fileName, fileType) {
  // ファイル名が被らないようにタイムスタンプなどをつける
  const uniqueFileName = `${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: uniqueFileName,
    ContentType: fileType,
  });

  // 60秒だけ有効なURLを発行
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  return {
    uploadUrl: signedUrl, // 書き込み用の一時URL
    publicUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}` // 保存後の公開URL
  };
}

// 2. アップロード完了後にDBに保存する関数
export async function savePostToDb(eventData, imageUrl) {
  // ※schema.prismaに合わせて書き換えてください
  const newPost = await prisma.post.create({
    data: {
      eventName: eventData.eventName,
      senderName: eventData.senderName, // フォームにあれば
      imageUrl: imageUrl,
    },
  });
  return newPost;
}