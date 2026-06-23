import multer from 'multer';

// メモリ上に一時保存する設定（Cloudinary等へ送る場合に一般的）
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('許可されていないファイル形式です。JPEG/PNG/GIF/WebPのみ対応しています。'), false);
        }
    },
});

// 企画作成などで複数の画像を受け取る可能性があるため、汎用的にエクスポート
export default upload;