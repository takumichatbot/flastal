import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  // パラメータ取得
  const title = searchParams.get('title')?.slice(0, 100) || 'FLASTAL フラスタ企画';
  const progress = searchParams.get('progress') || '0';
  const collected = searchParams.get('collected') || '0';
  const target = searchParams.get('target') || '0';
  // ※ 本当は背景画像なども動的に変えられます

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f9ff', // sky-50
          backgroundImage: 'radial-gradient(circle at 25px 25px, #e0f2fe 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e0f2fe 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        {/* ロゴエリア */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#0ea5e9' }}>FLASTAL</div>
        </div>

        {/* カード本体 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            width: '80%',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 24, color: '#64748b', marginBottom: 10, fontWeight: 'bold' }}>
            推しにフラスタを贈ろう！
          </div>
          
          <div style={{ fontSize: 48, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 30, lineHeight: 1.2 }}>
            {title}
          </div>

          {/* 進捗情報 */}
          <div style={{ display: 'flex', width: '100%', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 28, fontWeight: 'bold' }}>
              <span style={{ color: '#0ea5e9' }}>達成率 {progress}%</span>
              <span style={{ color: '#94a3b8' }}>あと {parseInt(target) - parseInt(collected)} pt</span>
            </div>
            
            {/* プログレスバー */}
            <div style={{ display: 'flex', width: '100%', height: 20, backgroundColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', width: `${progress}%`, height: '100%', backgroundColor: '#ec4899' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 20, color: '#64748b', marginTop: 5 }}>
              {collected} / {target} pt
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}