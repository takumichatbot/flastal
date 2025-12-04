import ProjectDetailClient from './ProjectDetailClient';

// ✅ 【重要】themeColor はここ（viewport）に書く必要があります
export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata({ params }) {
  // ❌ ここに themeColor: '#ffffff' があるとエラーになります！
  // もし残っていたら必ず削除してください。
  
  return {
    title: '企画詳細 | FLASTAL',
    description: '推し活フラスタ企画のクラウドファンディング',
  };
}

export default function Page() {
  return <ProjectDetailClient />;
}