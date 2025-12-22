import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

// フォントデータをキャッシュするための変数
let fontData = null;

async function loadGoogleFont(font, text) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@700&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status == 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error('failed to load font data');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // --- 1. パラメータ取得とサニタイズ ---
  const title = searchParams.get('title')?.slice(0, 60) || 'FLASTAL プロジェクト';
  const rawProgress = parseInt(searchParams.get('progress') || '0');
  const collected = parseInt(searchParams.get('collected') || '0');
  const target = parseInt(searchParams.get('target') || '0');
  const imageUrl = searchParams.get('image'); // プロジェクト画像のURL
  const username = searchParams.get('user') || '主催者';

  // 進捗率の計算（上限なし、または100%キャップなど要件に合わせて調整）
  const progress = isNaN(rawProgress) ? 0 : rawProgress;
  const isSuccess = progress >= 100;

  // --- 2. 日本語フォントの読み込み ---
  // タイトルに含まれる文字に必要なグリフだけを取得するのは複雑なため、
  // ここではシンプルに「Noto+Sans+JP」のBoldを取得する例とします。
  // ※実運用では必要な文字セットに絞るか、軽量なフォントの使用を推奨します。
  if (!fontData) {
    // Edge環境でfetchを使ってフォントを取得
    const res = await fetch(new URL('../../../assets/fonts/NotoSansJP-Bold.otf', import.meta.url).toString()).catch(() => null);
    
    // ※ローカルにフォントファイルを置くのが一番確実ですが、
    // ここではデモとしてGoogle Fontsから取得するコードを想定して記述します。
    // 実際にはGoogle Fonts APIを叩いてArrayBufferにする処理が必要です。
    // 今回は標準フォントで代用しつつ、CSSで綺麗に見せる構成にします。
  }

  // 数字のフォーマッター (例: 10,000)
  const formatNum = (num) => new Intl.NumberFormat('ja-JP').format(num);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#fff0f5', // 薄いピンク背景
          backgroundImage: 'linear-gradient(135deg, #fff0f5 0%, #ffe4e6 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装飾: 背景の円 */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(236, 72, 153, 0.1)', // pink-500
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.1)', // purple-500
            filter: 'blur(40px)',
          }}
        />

        {/* --- メインコンテナ --- */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            padding: '48px',
            gap: '40px',
            alignItems: 'center',
          }}
        >
          {/* 左側: テキスト情報 */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', height: '100%' }}>
            
            {/* ヘッダー: サービス名 & ユーザー */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                backgroundColor: '#ec4899', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '9999px', 
                fontSize: 20, 
                fontWeight: 600 
              }}>
                FLASTAL
              </div>
              <div style={{ color: '#64748b', fontSize: 20 }}>
                presented by {username}
              </div>
            </div>

            {/* タイトルエリア */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ 
                fontSize: 56, 
                fontWeight: 900, 
                color: '#1e293b', 
                lineHeight: 1.2,
                // 長いタイトルはCSSで省略...が効かない(Satori仕様)のでJSでslice済み
                textOverflow: 'ellipsis',
              }}>
                {title}
              </div>
              <div style={{ fontSize: 24, color: '#ec4899', fontWeight: 700 }}>
                #推し活 #フラスタ企画
              </div>
            </div>

            {/* 進捗ステータスカード */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: 'rgba(255,255,255,0.6)', 
              borderRadius: '20px', 
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 18, color: '#64748b', marginBottom: 4 }}>現在の支援総額</span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 48, fontWeight: 900, color: '#1e293b' }}>{formatNum(collected)}</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#64748b', marginLeft: 8 }}>円</span>
                  </div>
                </div>
                
                {/* 達成率バッジ or テキスト */}
                {isSuccess ? (
                  <div style={{ 
                    backgroundColor: '#fbbf24', 
                    color: '#92400e', 
                    padding: '8px 20px', 
                    borderRadius: '12px', 
                    fontSize: 28, 
                    fontWeight: 900,
                    border: '2px solid #fff'
                  }}>
                    SUCCESS!
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', color: '#ec4899' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, marginRight: 8 }}>達成率</span>
                    <span style={{ fontSize: 48, fontWeight: 900 }}>{progress}</span>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>%</span>
                  </div>
                )}
              </div>

              {/* プログレスバー */}
              <div style={{ width: '100%', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(progress, 100)}%`, 
                  height: '100%', 
                  backgroundColor: isSuccess ? '#fbbf24' : '#ec4899', // 達成したらゴールド、通常はピンク
                  borderRadius: '9999px' 
                }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <span style={{ fontSize: 18, color: '#94a3b8' }}>目標金額 {formatNum(target)}円</span>
              </div>
            </div>
          </div>

          {/* 右側: 画像エリア (あれば画像、なければプレースホルダー) */}
          <div style={{ 
            display: 'flex', 
            width: '400px', 
            height: '100%', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {imageUrl ? (
              // 外部画像を表示する場合はホスト名の許可設定などがnext.config.jsに必要ですが、OG生成内ではfetchして表示可能です
              <img src={imageUrl} alt="Project" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              // 画像がない場合のデフォルト表示
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#cbd5e1' }}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <div style={{ fontSize: 24, marginTop: 20, fontWeight: 700, color: '#94a3b8' }}>NO IMAGE</div>
              </div>
            )}
            
            {/* 画像の上に半透明のオーバーレイ（文字視認性のためではなく、質感を出すため） */}
            <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(255,255,255,0.5)', borderRadius: '24px' }} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // fonts: [ ... ] // ここでフォントデータを渡す
      // 実際の運用では Google Fonts APIなどを叩いてArrayBufferを渡し、
      // emojiのサポートなども検討する必要があります。
    },
  );
}