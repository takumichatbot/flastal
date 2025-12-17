'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiInfo, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 使用可能な変数のガイド（テンプレート作成時の参考に表示）
const VARIABLE_GUIDE = {
  'WELCOME': ['{{userName}} (ユーザー名)', '{{email}} (メールアドレス)', '{{loginUrl}} (ログインURL)'],
  'PROJECT_APPROVAL': ['{{userName}} (企画者名)', '{{projectTitle}} (企画名)', '{{projectUrl}} (企画URL)'],
  'PROJECT_REJECTED': ['{{userName}} (企画者名)', '{{projectTitle}} (企画名)', '{{reason}} (却下理由)'],
  'PROJECT_CANCELED': ['{{userName}} (受信者名)', '{{projectTitle}} (企画名)', '{{refundAmount}} (返金額)'],
  'FLORIST_OFFER': ['{{floristName}} (花屋名)', '{{projectTitle}} (企画名)', '{{offerUrl}} (オファーURL)'],
};

// デフォルトのテンプレート定義（DBが空の場合の初期値）
const DEFAULT_TEMPLATES = [
  { key: 'WELCOME', name: '会員登録完了', subject: '【FLASTAL】会員登録ありがとうございます', body: '{{userName}} 様\n\nFLASTALへようこそ！登録が完了しました。\n\nログインはこちら:\n{{loginUrl}}' },
  { key: 'PROJECT_APPROVAL', name: '企画承認のお知らせ', subject: '【FLASTAL】企画が公開されました', body: '{{userName}} 様\n\nあなたの企画「{{projectTitle}}」が承認され、公開されました。\n\n企画ページ:\n{{projectUrl}}' },
  { key: 'PROJECT_REJECTED', name: '企画却下のお知らせ', subject: '【FLASTAL】企画の審査結果について', body: '{{userName}} 様\n\n誠に残念ながら、企画「{{projectTitle}}」は以下の理由により承認されませんでした。\n\n理由:\n{{reason}}' },
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
        if (data.length === 0) {
            // データがない場合はデフォルトを表示（保存はされていない状態）
            setTemplates(DEFAULT_TEMPLATES.map(t => ({ ...t, id: null })));
        } else {
            setTemplates(data);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
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
      toast.success('テンプレートを保存しました');
      
      // リストを更新
      setTemplates(prev => {
        const exists = prev.some(t => t.key === saved.key);
        if (exists) {
            return prev.map(t => t.key === saved.key ? saved : t);
        } else {
            return [...prev, saved];
        }
      });
      setSelectedTemplate(saved);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (temp) => {
      setSelectedTemplate({ ...temp }); // コピーを作成して編集用にする
  };

  if (loading) return <div className="p-8 text-center text-gray-500">テンプレート読み込み中...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[600px] border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* 左サイドバー: リスト */}
      <div className="w-full md:w-1/3 border-r bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b bg-gray-100 font-bold text-gray-700 flex justify-between items-center">
          <span>テンプレート一覧</span>
          <button onClick={fetchTemplates} className="text-gray-500 hover:text-indigo-600"><FiRefreshCw/></button>
        </div>
        <ul>
          {templates.map(temp => (
            <li 
              key={temp.key || temp.id}
              onClick={() => handleSelect(temp)}
              className={`p-4 cursor-pointer border-b hover:bg-white transition-colors ${selectedTemplate?.key === temp.key ? 'bg-white border-l-4 border-l-indigo-500 shadow-inner' : ''}`}
            >
              <div className="font-bold text-gray-800 text-sm">{temp.name || temp.key}</div>
              <div className="text-xs text-gray-500 truncate mt-1">{temp.subject}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* 右メイン: エディタ */}
      <div className="w-full md:w-2/3 flex flex-col bg-white">
        {selectedTemplate ? (
          <>
            <div className="p-6 flex-grow overflow-y-auto">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">テンプレート名 (管理用)</label>
                <input 
                  type="text" 
                  value={selectedTemplate.name || ''} 
                  onChange={e => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                  className="w-full p-2 border rounded bg-gray-50 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">件名 (Subject)</label>
                <input 
                  type="text" 
                  value={selectedTemplate.subject || ''} 
                  onChange={e => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  placeholder="メールの件名を入力"
                />
              </div>

              <div className="mb-4 flex-grow">
                <label className="block text-sm font-bold text-gray-700 mb-1">本文 (Body)</label>
                <textarea 
                  value={selectedTemplate.body || ''} 
                  onChange={e => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                  className="w-full h-64 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
                  placeholder="メールの本文を入力..."
                />
              </div>

              {/* 変数ガイド */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm">
                <div className="font-bold text-indigo-800 mb-2 flex items-center text-xs"><FiInfo className="mr-1"/> このテンプレートで使える変数</div>
                <div className="flex flex-wrap gap-2">
                  {(VARIABLE_GUIDE[selectedTemplate.key] || ['共通変数なし']).map(v => (
                    <span key={v} className="bg-white px-2 py-1 rounded border border-indigo-200 text-xs text-indigo-600 font-mono select-all">
                      {v.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end items-center">
              {selectedTemplate.id && (
                  <span className="text-xs text-gray-400 mr-auto">ID: {selectedTemplate.id}</span>
              )}
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center transition-all shadow-sm"
              >
                {saving ? <FiRefreshCw className="animate-spin mr-2"/> : <FiSave className="mr-2"/>}
                保存する
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FiCheck className="text-4xl mb-2 opacity-20"/>
            <p>左のリストから編集するテンプレートを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}