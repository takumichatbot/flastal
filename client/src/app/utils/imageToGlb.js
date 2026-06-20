/**
 * 画像ファイル → GLB (花立パネル) 変換
 * Three.js で指定高さの縦型平面メッシュを生成し、GLBのBlobURLを返す。
 * model-viewer に直接渡すことでARプレビューが動作する。
 */
export async function imageFileToGlbUrl(imageFile, heightCm = 200) {
  const { Scene, PlaneGeometry, MeshBasicMaterial, Mesh, Texture, SRGBColorSpace } = await import('three');
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // canvas 経由でテクスチャ生成（GLTFExporter が canvas を要求するため）
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const texture = new Texture(canvas);
        texture.needsUpdate = true;
        texture.colorSpace = SRGBColorSpace;

        const heightM = heightCm / 100;
        const widthM = heightM * (img.naturalWidth / img.naturalHeight);

        const geometry = new PlaneGeometry(widthM, heightM);
        const material = new MeshBasicMaterial({ map: texture, side: 2 /* DoubleSide */ });
        const mesh = new Mesh(geometry, material);

        const scene = new Scene();
        scene.add(mesh);

        const exporter = new GLTFExporter();
        exporter.parse(
          scene,
          (glb) => {
            if (glb instanceof ArrayBuffer) {
              const blob = new Blob([glb], { type: 'model/gltf-binary' });
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('GLB export returned unexpected type'));
            }
          },
          (err) => reject(err),
          { binary: true }
        );
      };

      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(imageFile);
  });
}
