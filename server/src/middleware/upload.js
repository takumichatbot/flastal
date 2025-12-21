import multer from 'multer';

// メモリストレージを使用（Cloudinaryへ直接アップロードするため）
const upload = multer({ storage: multer.memoryStorage() });

export default upload;