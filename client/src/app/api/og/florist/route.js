import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const shopName   = searchParams.get('name')?.slice(0, 30) || '花屋さん';
  const prefecture = searchParams.get('prefecture') || '';
  const imageUrl   = searchParams.get('image');
  const responseRate = searchParams.get('responseRate');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 左: 画像エリア */}
        <div style={{ width: 400, height: 630, position: 'relative', display: 'flex', overflow: 'hidden' }}>
          {imageUrl ? (
            <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #f9a8d4 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120 }}>
              🌸
            </div>
          )}
          {/* オーバーレイ */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(253,242,248,0.95) 100%)' }} />
        </div>

        {/* 右: テキストエリア */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 48px', gap: 20 }}>
          {/* FLASTALロゴ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 24, color: '#ec4899', fontWeight: 900, letterSpacing: '-1px' }}>🌸 FLASTAL</div>
            <div style={{ fontSize: 12, color: '#f9a8d4', background: '#831843', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>認定花屋</div>
          </div>

          {/* ショップ名 */}
          <div style={{ fontSize: shopName.length > 12 ? 38 : 46, fontWeight: 900, color: '#1e293b', lineHeight: 1.1 }}>
            {shopName}
          </div>

          {/* 都道府県 */}
          {prefecture && (
            <div style={{ fontSize: 18, color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              📍 {prefecture}
            </div>
          )}

          {/* 返答率 */}
          {responseRate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ecfdf5', padding: '10px 16px', borderRadius: 16, border: '1.5px solid #a7f3d0', width: 'fit-content' }}>
              <div style={{ fontSize: 18 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#065f46' }}>返答率 {responseRate}%</div>
            </div>
          )}

          {/* フッター */}
          <div style={{ marginTop: 'auto', fontSize: 14, color: '#94a3b8', fontWeight: 700 }}>
            flastal.com でご予約・お問い合わせ
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
