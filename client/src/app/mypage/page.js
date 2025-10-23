"use client";
export const dynamic = 'force-dynamic';


import { useEffect, useState, useCallback } from 'react'; // ★ useCallback をインポート
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation'; // ★ useSearchParams をインポート
import Link from 'next/link';
import toast from 'react-hot-toast'; // ★ toast をインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★ ステータス表示用のヘルパー関数
const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING_APPROVAL': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">審査中</span>;
    case 'FUNDRAISING': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">募集中</span>;
    case 'SUCCESSFUL': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300">達成</span>;
    case 'COMPLETED': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">完了</span>;
    case 'CANCELED': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">中止</span>;
    case 'REJECTED': return <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300">却下</span>;
    default: return null;
  }
};

export default function MyPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // ★ URLクエリパラメータを取得

  // ★ URLクエリから初期タブを設定 ('profile' がデフォルト)
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [createdProjects, setCreatedProjects] = useState([]);
  const [pledgedProjects, setPledgedProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // データ取得中フラグの名前を変更

  // ★ データ取得関数を useCallback でメモ化
  const fetchMyData = useCallback(async () => {
    if (!user || !user.id) return; // user.id が存在することも確認
    setLoadingData(true);
    try {
      const [createdRes, pledgedRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${user.id}/created-projects`),
        fetch(`${API_URL}/api/users/${user.id}/pledged-projects`)
      ]);

      // エラーハンドリングを強化
      if (!createdRes.ok) {
          const errorData = await createdRes.json().catch(() => ({})); // JSONパース失敗も考慮
          throw new Error(`作成した企画の取得失敗: ${errorData.message || createdRes.statusText}`);
      }
      if (!pledgedRes.ok) {
          const errorData = await pledgedRes.json().catch(() => ({}));
          throw new Error(`支援した企画の取得失敗: ${errorData.message || pledgedRes.statusText}`);
      }

      const createdData = await createdRes.json();
      const pledgedData = await pledgedRes.json();
      setCreatedProjects(Array.isArray(createdData) ? createdData : []); // 配列であることを確認
      setPledgedProjects(Array.isArray(pledgedData) ? pledgedData : []); // 配列であることを確認

    } catch (error) {
      console.error("マイページデータの取得に失敗しました:", error);
      toast.error(error.message || "データの取得に失敗しました。"); // ユーザーにエラーを通知
      setCreatedProjects([]); // エラー時は空にする
      setPledgedProjects([]);
    } finally {
      setLoadingData(false);
    }
  }, [user]); // userが変わった時だけ関数を再生成

  // ★ useEffectの依存配列に fetchMyData を追加
  useEffect(() => {
    if (authLoading) return; // 認証情報読み込み中は待機
    if (!user) {
      router.push('/login'); // 未ログインならログインページへ
      return;
    }
    fetchMyData(); // ユーザー情報があればデータを取得
  }, [user, authLoading, router, fetchMyData]); // fetchMyDataも依存配列に追加

  // 認証情報読み込み中、または未ログイン時の表示
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sky-50">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // タブの内容を描画する関数
  const renderTabContent = () => {
    if (loadingData) return <p className="text-gray-600 text-center py-4">企画データを読み込み中...</p>;

    switch (activeTab) {
      case 'created':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">作成した企画</h2>
            {createdProjects.length > 0 ? createdProjects.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 shadow-sm">
                <div className="flex-grow mb-2 sm:mb-0 sm:mr-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {/* ★ ステータスバッジを表示 */}
                    {getStatusBadge(p.status)}
                    {/* 企画タイトルへのリンク */}
                    {p.status !== 'REJECTED' && p.status !== 'PENDING_APPROVAL' ? (
                       <Link href={`/projects/${p.id}`} legacyBehavior>
                           <a className="font-semibold text-sky-600 hover:underline truncate">{p.title}</a>
                       </Link>
                    ) : (
                       <span className="font-semibold text-gray-700 truncate">{p.title}</span>
                    )}

                  </div>
                  {/* ★ 募集中・達成・完了の場合のみ進捗を表示 */}
                  {(p.status === 'FUNDRAISING' || p.status === 'SUCCESSFUL' || p.status === 'COMPLETED') && (
                    <p className="text-sm text-gray-500 mt-1">
                      {p.collectedAmount?.toLocaleString() ?? 0} pt / {p.targetAmount?.toLocaleString() ?? 0} pt
                    </p>
                  )}
                  {/* ★ 却下された場合の表示 */}
                  {p.status === 'REJECTED' && (
                     <p className="text-sm text-red-600 mt-1">
                        この企画は承認されませんでした。
                     </p>
                  )}
                  {/* ★ 審査中の場合の表示 */}
                   {p.status === 'PENDING_APPROVAL' && (
                     <p className="text-sm text-yellow-700 mt-1">
                        運営による審査中です。承認されると公開されます。
                     </p>
                  )}
                </div>
                {/* 右側にボタンなどを置くスペース（将来用） */}
                {/* 例: <button className="...">編集</button> */}
              </div>
            )) : <p className="text-gray-600 text-center py-4">まだ作成した企画はありません。</p>}
          </div>
        );
      case 'pledged':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">支援した企画</h2>
            {pledgedProjects.length > 0 ? pledgedProjects.map(pledge => (
              // pledgeとpledge.projectが存在するか確認
              pledge && pledge.project ? (
                <div key={pledge.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                  <p className="text-gray-800">
                    <Link href={`/projects/${pledge.project.id}`} legacyBehavior><a className="font-semibold text-sky-600 hover:underline">{pledge.project.title}</a></Link>に <span className="font-bold text-sky-600">{pledge.amount?.toLocaleString() ?? 0} pt</span> 支援しました
                  </p>
                   {/* 支援日時などを表示 */}
                   <p className="text-xs text-gray-400 mt-1 text-right">
                       {new Date(pledge.createdAt).toLocaleString('ja-JP')}
                   </p>
                </div>
               ) : null // データが不正な場合は何も表示しない
            )) : <p className="text-gray-600 text-center py-4">まだ支援した企画はありません。</p>}
          </div>
        );
      case 'profile':
      default:
        // プロフィールタブのデザインを少しリッチにします
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">プロフィール情報</h2>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <span className="text-gray-600 mb-1 sm:mb-0">ハンドルネーム:</span>
                <span className="font-semibold text-lg text-gray-900">{user.handleName}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <span className="text-gray-600 mb-1 sm:mb-0">保有ポイント:</span>
                <span className="font-bold text-2xl text-sky-600">{(user.points || 0).toLocaleString()} pt</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <span className="text-gray-600 mb-1 sm:mb-0">メールアドレス:</span>
                <span className="font-semibold text-lg text-gray-900">{user.email}</span>
              </div>
            </div>
            <div className="mt-10 p-6 bg-sky-50 rounded-lg shadow-inner">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">あなたの紹介コード</h3>
              <p className="text-sm text-gray-600 mb-4">
                友達がこのコードを使って登録し、初めてポイントを購入すると、あなたに 500 pt が付与されます！
              </p>
              <div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-sm border border-sky-100">
                <input
                    type="text"
                    readOnly
                    value={user.referralCode}
                    className="flex-grow font-mono text-lg text-sky-700 tracking-wider bg-transparent border-none focus:ring-0 p-0"
                    aria-label="紹介コード"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.referralCode);
                    toast.success('紹介コードをコピーしました！');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors bg-sky-500 hover:bg-sky-600 flex-shrink-0"
                  aria-label="紹介コードをコピー"
                >
                  コピー
                </button>
              </div>
            </div>
             {/* 将来的にプロフィール編集機能へのリンクなどを追加 */}
             {/* <div className="mt-6 text-right">
                <button className="text-sm text-sky-600 hover:underline">プロフィールを編集</button>
             </div> */}
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-sky-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* ログアウトボタンはヘッダーにあるため削除 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>

          <div className="mb-6 border-b border-gray-300">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>プロフィール</button>
              <button onClick={() => setActiveTab('created')} className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'created' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>作成した企画</button>
              <button onClick={() => setActiveTab('pledged')} className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'pledged' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>支援した企画</button>
            </nav>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* レビューモーダルはまだコメントアウトのまま */}
      {/* {reviewingProject && ( ... )} */}
    </>
  );
}