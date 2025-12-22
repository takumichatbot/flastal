import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

// Google Fontsからフォントデータを取得する関数
async function loadGoogleFont(fontFamily, text) {
  const API = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@700&text=${encodeURIComponent(text)}`;
  
  const css = await (await fetch(API)).text();
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

  // --- 1. パラメータ取得 ---
  const title = searchParams.get('title')?.slice(0, 50) || 'FLASTAL プロジェクト';
  const rawProgress = parseInt(searchParams.get('progress') || '0');
  const collected = parseInt(searchParams.get('collected') || '0');
  const target = parseInt(searchParams.get('target') || '0');
  const imageUrl = searchParams.get('image'); 
  const username = searchParams.get('user') || '主催者';

  const progress = isNaN(rawProgress) ? 0 : rawProgress;
  const isSuccess = progress >= 100;

  // 数字フォーマッター
  const formatNum = (num) => new Intl.NumberFormat('ja-JP').format(num);

  // --- 2. フォントデータの取得 ---
  // 画像に含まれる可能性のあるテキストを列挙して、サブセット化されたフォントを取得
  // (容量削減のため、本来は必要な文字だけ渡すのがベスト)
  const fontText = title + username + '現在の支援総額円達成率目標金額SUCCESSNOIMAGEFLASTAL0123456789%';
  const fontData = await loadGoogleFont('Noto+Sans+JP', fontText).catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#fff0f5', // 薄いピンク
          backgroundImage: 'linear-gradient(135deg, #fff0f5 0%, #ffe4e6 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"Noto Sans JP"',
        }}
      >
        {/* 背景装飾 (ぼかし円) */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(236, 72, 153, 0.15)', // pink-500
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.15)', // purple-500
            filter: 'blur(60px)',
          }}
        />

        {/* --- メインコンテンツ --- */}
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
            
            {/* ヘッダー */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                backgroundColor: '#ec4899', 
                color: 'white', 
                padding: '6px 16px', 
                borderRadius: '9999px', 
                fontSize: 20, 
                fontWeight: 700 
              }}>
                FLASTAL
              </div>
              <div style={{ color: '#64748b', fontSize: 20, fontWeight: 700 }}>
                @{username}
              </div>
            </div>

            {/* タイトル */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ 
                fontSize: 52, 
                fontWeight: 900, 
                color: '#1e293b', 
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 3, // 3行制限
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {title}
              </div>
            </div>

            {/* ステータスカード */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: 'rgba(255,255,255,0.7)', 
              borderRadius: '24px', 
              padding: '24px',
              border: '2px solid rgba(255,255,255,0.9)',
              boxShadow: '0 8px 16px -4px rgba(236, 72, 153, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                
                {/* 金額表示 */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 16, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>現在の支援総額</span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 56, fontWeight: 900, color: '#be185d' }}>{formatNum(collected)}</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#64748b', marginLeft: 8 }}>円</span>
                  </div>
                </div>
                
                {/* 達成バッジ */}
                {isSuccess ? (
                  <div style={{ 
                    backgroundColor: '#fbbf24', 
                    color: '#fff', 
                    padding: '8px 24px', 
                    borderRadius: '12px', 
                    fontSize: 32, 
                    fontWeight: 900,
                    border: '3px solid #fff',
                    boxShadow: '0 4px 6px rgba(251, 191, 36, 0.4)',
                    transform: 'rotate(-5deg)'
                  }}>
                    SUCCESS!
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', color: '#ec4899' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, marginRight: 8 }}>達成率</span>
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
                  backgroundColor: isSuccess ? '#fbbf24' : '#ec4899', 
                  borderRadius: '9999px' 
                }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 700 }}>GOAL: {formatNum(target)}円</span>
              </div>
            </div>
          </div>

          {/* 右側: 画像エリア */}
          <div style={{ 
            display: 'flex', 
            width: '420px', 
            height: '100%', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
            backgroundColor: '#f8fafc',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: '6px solid white'
          }}>
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#cbd5e1' }}>
                <div style={{ fontSize: 80, marginBottom: 10 }}>💐</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#94a3b8' }}>NO IMAGE</div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData ? [
        {
          name: 'Noto Sans JP',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ] : [],
    },
  );
}