// src/components/admin/EmailTemplateManager.js
'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiInfo, FiCheck, FiPlus, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★★★ 修正: 直前に実装したメール認証用（VERIFICATION_EMAIL）などを追加 ★★★
const VARIABLE_GUIDE = {
  'VERIFICATION_EMAIL': ['{{userName}} (宛名)', '{{verificationUrl}} (認証URL/必須)'], // ★追加
  'WELCOME': ['{{userName}} (ユーザー名)', '{{email}} (メールアドレス)', '{{loginUrl}} (ログインURL)'],
  'PROJECT_APPROVAL': ['{{userName}} (企画者名)', '{{projectTitle}} (企画名)', '{{projectUrl}} (企画URL)'],
  'PROJECT_REJECTED': ['{{userName}} (企画者名)', '{{projectTitle}} (企画名)', '{{reason}} (却下理由)'],
  'PROJECT_CANCELED': ['{{userName}} (受信者名)', '{{projectTitle}} (企画名)', '{{refundAmount}} (返金額)'],
  'FLORIST_OFFER': ['{{floristName}} (花屋名)', '{{projectTitle}} (企画名)', '{{offerUrl}} (オファーURL)'],
  'ACCOUNT_APPROVED': ['{{userName}} (ユーザー名)', '{{loginUrl}} (ログインURL)'],
  'PAYMENT_COMPLETED': ['{{userName}} (ユーザー名)', '{{amount}} (金額)', '{{projectTitle}} (項目名)'], // 出金用
};

// ★★★ 修正: デフォルトテンプレートにも認証メールを追加 ★★★
const DEFAULT_TEMPLATES = [
  { 
    key: 'VERIFICATION_EMAIL', 
    name: 'メールアドレス認証', 
    subject: '【FLASTAL】メールアドレスの確認をお願いします', 
    body: '{{userName}} 様\n\nFLASTALにご登録ありがとうございます。\n以下のリンクをクリックして、メールアドレスの認証を完了してください。\n\n認証リンク:\n{{verificationUrl}}\n\n※このリンクの有効期限は1時間です。' 
  },
  { key: 'WELCOME', name: '会員登録完了', subject: '【FLASTAL】会員登録ありがとうございます', body: '{{userName}} 様\n\nFLASTALへようこそ！登録が完了しました。\n\nログインはこちら:\n{{loginUrl}}' },
  { key: 'PROJECT_APPROVAL', name: '企画承認のお知らせ', subject: '【FLASTAL】企画が公開されました', body: '{{userName}} 様\n\nあなたの企画「{{projectTitle}}」が承認され、公開されました。\n\n企画ページ:\n{{projectUrl}}' },
  { key: 'PROJECT_REJECTED', name: '企画却下のお知らせ', subject: '【FLASTAL】企画の審査結果について', body: '{{userName}} 様\n\n誠に残念ながら、企画「{{projectTitle}}」は以下の理由により承認されませんでした。\n\n理由:\n{{reason}}' },
  { key: 'ACCOUNT_APPROVED', name: 'アカウント承認通知', subject: '【FLASTAL】アカウント審査完了のお知らせ', body: '{{userName}} 様\n\nアカウントの審査が完了し、ご利用いただけるようになりました。\n\nログインはこちら:\n{{loginUrl}}' },
];

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/admin/email-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // サーバーからのデータとデフォルト定義をマージして表示
        // (サーバーにないKEYはデフォルト定義から表示する)
        const mergedTemplates = DEFAULT_TEMPLATES.map(def => {
            const existing = data.find(d => d.key === def.key);
            return existing || { ...def, id: null }; // IDがなければ未保存扱い
        });
        
        // DEFAULT_TEMPLATESにないカスタムテンプレートがもしあれば追加
        data.forEach(d => {
            if (!DEFAULT_TEMPLATES.some(def => def.key === d.key)) {
                mergedTemplates.push(d);
            }
        });

        setTemplates(mergedTemplates);
      }
    } catch (error) {
      console.error(error);
      toast.error('テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 新規作成モード
  const handleCreateNew = () => {
      setSelectedTemplate({
          key: '',
          name: '新規テンプレート',
          subject: '',
          body: '',
          isNew: true 
      });
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (!selectedTemplate.key) return toast.error('テンプレートキー(KEY)は必須です');
    
    setSaving(true);
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

    try {
      const res = await fetch(`${API_URL}/api/admin/email-templates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedTemplate),
      });

      if (!res.ok) throw new Error('保存に失敗しました');
      
      const saved = await res.json();
      toast.success(`「${saved.name}」を保存しました`);
      
      // リストを更新
      setTemplates(prev => {
        return prev.map(t => t.key === saved.key ? saved : t);
      });
      // 選択状態も更新（IDが入った状態にする）
      setSelectedTemplate({ ...saved, isNew: false });

    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (temp) => {
      // 編集用にコピーしてセット
      setSelectedTemplate({ ...temp, isNew: false }); 
  };

  if (loading) return <div className="p-12 text-center text-gray-400 animate-pulse">テンプレート情報を読み込んでいます...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[650px] border rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
      
      

      {/* 左サイドバー: リスト */}
      <div className="w-full md:w-1/3 border-r bg-gray-50/50 overflow-y-auto flex flex-col">
        <div className="p-4 border-b bg-gray-100/80 backdrop-blur-sm font-bold text-gray-700 flex justify-between items-center sticky top-0 z-10">
          <span className="text-sm">テンプレート一覧</span>
          <div className="flex gap-2">
            <button onClick={handleCreateNew} className="text-pink-600 hover:bg-pink-100 p-2 rounded-full transition-colors" title="新規作成">
                <FiPlus size={18}/>
            </button>
            <button onClick={fetchTemplates} className="text-gray-500 hover:text-indigo-600 p-2 rounded-full transition-colors" title="再読み込み">
                <FiRefreshCw size={16}/>
            </button>
          </div>
        </div>
        <ul className="flex-grow divide-y divide-gray-100">
          {templates.map(temp => (
            <li 
              key={temp.key || Math.random()}
              onClick={() => handleSelect(temp)}
              className={`p-4 cursor-pointer hover:bg-white transition-all duration-200 ${
                  selectedTemplate?.key === temp.key 
                  ? 'bg-white border-l-4 border-l-pink-500 shadow-sm' 
                  : 'border-l-4 border-l-transparent text-gray-600'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold text-sm ${selectedTemplate?.key === temp.key ? 'text-pink-600' : 'text-gray-700'}`}>
                      {temp.name || temp.key}
                  </span>
                  {!temp.id && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">未保存</span>}
              </div>
              <div className="text-xs text-gray-400 font-mono truncate">{temp.key}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* 右メイン: エディタ */}
      <div className="w-full md:w-2/3 flex flex-col bg-white">
        {selectedTemplate ? (
          <>
            <div className="p-6 flex-grow overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">管理用名称</label>
                    <input 
                      type="text" 
                      value={selectedTemplate.name || ''} 
                      onChange={e => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                      className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                      placeholder="例: メール認証用"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center">
                        システムKEY <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">変更不可</span>
                    </label>
                    <input 
                      type="text" 
                      value={selectedTemplate.key || ''} 
                      onChange={e => setSelectedTemplate({...selectedTemplate, key: e.target.value.toUpperCase()})} 
                      className={`w-full p-2.5 border border-gray-200 rounded-lg text-sm font-mono ${selectedTemplate.isNew ? 'bg-white focus:ring-2 focus:ring-pink-500' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                      placeholder="例: VERIFICATION_EMAIL"
                      disabled={!selectedTemplate.isNew && selectedTemplate.id} 
                    />
                  </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-1.5">件名 (Subject)</label>
                <input 
                  type="text" 
                  value={selectedTemplate.subject || ''} 
                  onChange={e => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all shadow-sm"
                  placeholder="メールの件名を入力..."
                />
              </div>

              <div className="mb-6 flex-grow flex flex-col">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between">
                    <span>本文 (Body)</span>
                    <span className="text-gray-300 font-normal">HTMLタグ使用可能</span>
                </label>
                <textarea 
                  value={selectedTemplate.body || ''} 
                  onChange={e => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                  className="w-full h-72 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none font-mono text-sm leading-relaxed resize-none shadow-inner"
                  placeholder="メールの本文を入力..."
                />
              </div>

              {/* 変数ガイド */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="font-bold text-blue-700 mb-3 flex items-center text-xs">
                    <FiInfo className="mr-1.5"/> 
                    利用可能な変数 (クリックしてコピー)
                </div>
                <div className="flex flex-wrap gap-2">
                  {(VARIABLE_GUIDE[selectedTemplate.key] || ['共通変数なし']).map((v, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => {
                            navigator.clipboard.writeText(v.split(' ')[0]);
                            toast.success('コピーしました', { duration: 1000, icon: '📋' });
                        }}
                        className="bg-white px-3 py-1.5 rounded-md border border-blue-200 text-xs text-blue-600 font-mono hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
                    >
                      {v.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-blue-400 mt-2 ml-1">
                    ※ <code>VERIFICATION_EMAIL</code> キーの場合は <code>{'{{verificationUrl}}'}</code> が必須です。
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-400 font-mono">
                  {selectedTemplate.id ? `ID: ${selectedTemplate.id.substring(0, 8)}...` : '新規作成中'}
              </div>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="px-8 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-lg hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200"
              >
                {saving ? <FiRefreshCw className="animate-spin mr-2"/> : <FiSave className="mr-2"/>}
                保存する
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/30">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="text-3xl text-gray-300"/>
            </div>
            <p className="font-bold text-gray-500">テンプレートを選択してください</p>
            <p className="text-sm mt-2">左のリストから編集するか、<br/>右上の＋ボタンで新規作成できます</p>
          </div>
        )}
      </div>
    </div>
  );
}