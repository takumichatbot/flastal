import multer from 'multer';
import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';

// 基本設定: メモリストレージを使用
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB制限
});

/**
 * 画像処理・Cloudinaryアップロードユーティリティ
 * コントローラー側で利用可能な共通関数として提供
 */
export const uploadToCloudinary = async (file, folder = 'flastal') => {
    try {
        // sharpによる画像最適化 (WebP変換, 1200pxリサイズ)
        const optimizedBuffer = await sharp(file.buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Cloudinaryへのストリームアップロード
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'auto',
                    format: 'webp'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result.secure_url);
                }
            );
            uploadStream.end(optimizedBuffer);
        });
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('画像のアップロードに失敗しました。');
    }
};

export default upload;