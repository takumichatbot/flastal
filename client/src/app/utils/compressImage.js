/**
 * ブラウザ上でCanvas APIを使って画像を圧縮する
 * @param {File|Blob} file - 圧縮する画像ファイル
 * @param {Object} options
 * @param {number} options.maxWidth - 最大幅（デフォルト: 1920）
 * @param {number} options.maxHeight - 最大高さ（デフォルト: 1920）
 * @param {number} options.quality - JPEG品質 0〜1（デフォルト: 0.8）
 * @param {string} options.type - 出力MIMEタイプ（デフォルト: 'image/webp'）
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, { maxWidth = 1920, maxHeight = 1920, quality = 0.8, type = 'image/webp' } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('圧縮に失敗しました')),
        type,
        quality,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
