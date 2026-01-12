import multer from 'multer';

// メモリ上に一時保存する設定（Cloudinary等へ送る場合に一般的）
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// 企画作成などで複数の画像を受け取る可能性があるため、汎用的にエクスポート
export default upload;