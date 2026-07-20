// src/components/admin/EmailTemplateManager.js
'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiInfo, FiCheck, FiPlus, FiTrash2, FiAlertCircle, FiCopy, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 変数定義ガイド (キーごとに使える変数を定義)
const VARIABLE_GUIDE = {
  'VERIFICATION_EMAIL': ['{{userName}}', '{{verificationUrl}}'], 
  'WELCOME': ['{{userName}}', '{{email}}', '{{loginUrl}}'],
  'PROJECT_APPROVAL': ['{{userName}}', '{{projectTitle}}', '{{projectUrl}}'],
  'PROJECT_REJECTED': ['{{userName}}', '{{projectTitle}}', '{{reason}}'],
  'PROJECT_CANCELED': ['{{userName}}', '{{projectTitle}}', '{{refundAmount}}'],
  'FLORIST_OFFER': ['{{floristName}}', '{{projectTitle}}', '{{offerUrl}}'],
  'ACCOUNT_APPROVED': ['{{userName}}', '{{loginUrl}}'],
  'PAYMENT_COMPLETED': ['{{userName}}', '{{amount}}', '{{projectTitle}}'],
};

// デフォルトテンプレート定義
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
      const token = window.__flastalToken;
      const res = await fetch(`${API_URL}/api/admin/email-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // サーバーデータとデフォルトデータをマージ
        const mergedTemplates = DEFAULT_TEMPLATES.map(def => {
            const existing = data.find(d => d.key === def.key);
            return existing || { ...def, id: null }; 
        });
        
        // カスタムテンプレートがあれば追加
        data.forEach(d => {
            if (!DEFAULT_TEMPLATES.some(def => def.key === d.key)) {
                mergedTemplates.push(d);
            }
        });

        setTemplates(mergedTemplates);
        // 初期選択 (一番上)
        if (mergedTemplates.length > 0 && !selectedTemplate) {
            setSelectedTemplate({ ...mergedTemplates[0], isNew: false });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
    const token = window.__flastalToken;

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
      toast.success('保存しました');
      
      setTemplates(prev => {
        // 新規作成か更新かで分岐
        const exists = prev.some(t => t.key === saved.key);
        if (exists) {
            return prev.map(t => t.key === saved.key ? saved : t);
        } else {
            return [...prev, saved];
        }
      });
      
      setSelectedTemplate({ ...saved, isNew: false });

    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (temp) => {
      setSelectedTemplate({ ...temp, isNew: false }); 
  };

  // 変数をクリップボードにコピー
  const copyVariable = (variable) => {
      navigator.clipboard.writeText(variable);
      toast.success(`${variable} をコピーしました`, { 
          icon: '📋',
          position: 'bottom-center',
          style: { fontSize: '12px' }
      });
  };

  if (loading) return <div className="p-12 text-center text-gray-400 animate-pulse">読み込み中...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[650px] border rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
      
      {/* 左サイドバー: テンプレートリスト */}
      <div className="w-full md:w-80 border-r bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Templates</span>
          <div className="flex gap-1">
            <button onClick={handleCreateNew} className="p-1.5 text-pink-600 hover:bg-pink-50 rounded transition-colors" title="新規作成">
                <FiPlus size={16}/>
            </button>
            <button onClick={fetchTemplates} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="再読み込み">
                <FiRefreshCw size={14}/>
            </button>
          </div>
        </div>
        
        <ul className="flex-grow overflow-y-auto custom-scrollbar">
          {templates.map(temp => (
            <li 
              key={temp.key || Math.random()}
              onClick={() => handleSelect(temp)}
              className={`
                  group px-4 py-3 cursor-pointer border-l-[3px] transition-all
                  ${selectedTemplate?.key === temp.key 
                    ? 'bg-white border-pink-500 shadow-sm' 
                    : 'border-transparent hover:bg-white hover:border-gray-300 text-gray-600'}
              `}
            >
              <div className="flex justify-between items-start mb-0.5">
                  <span className={`text-sm font-bold truncate ${selectedTemplate?.key === temp.key ? 'text-gray-900' : 'text-gray-700'}`}>
                      {temp.name || temp.key}
                  </span>
                  {!temp.id && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">未保存</span>}
              </div>
              <div className="text-[10px] text-gray-400 font-mono truncate opacity-80">{temp.key}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* 右メイン: エディタ */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {selectedTemplate ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              
              {/* 基本情報フォーム */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">管理用名称</label>
                    <input 
                      type="text" 
                      value={selectedTemplate.name || ''} 
                      onChange={e => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                      placeholder="例: メール認証通知"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase flex items-center justify-between">
                        システムキー 
                        {!selectedTemplate.isNew && <span className="text-[9px] bg-gray-100 px-1.5 rounded text-gray-500">変更不可</span>}
                    </label>
                    <input 
                      type="text" 
                      value={selectedTemplate.key || ''} 
                      onChange={e => setSelectedTemplate({...selectedTemplate, key: e.target.value.toUpperCase()})} 
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono ${selectedTemplate.isNew ? 'bg-white focus:border-pink-500' : 'bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                      placeholder="例: VERIFICATION_EMAIL"
                      disabled={!selectedTemplate.isNew && selectedTemplate.id} 
                    />
                  </div>
              </div>

              {/* 件名 */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">件名 (Subject)</label>
                <input 
                  type="text" 
                  value={selectedTemplate.subject || ''} 
                  onChange={e => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                  placeholder="メールの件名を入力..."
                />
              </div>

              {/* 変数ガイド (ここが重要) */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase flex items-center">
                    <FiInfo className="mr-1"/> 
                    利用可能な変数 <span className="text-[10px] font-normal normal-case ml-2 text-gray-400">クリックしてコピー</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(VARIABLE_GUIDE[selectedTemplate.key] || []).length > 0 ? (
                      VARIABLE_GUIDE[selectedTemplate.key].map((v, idx) => (
                        <button 
                            key={idx} 
                            type="button"
                            onClick={() => copyVariable(v)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-2 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1 group"
                        >
                          {v} 
                          <FiCopy className="opacity-0 group-hover:opacity-100 transition-opacity" size={10} />
                        </button>
                      ))
                  ) : (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">固有の変数はありません</span>
                  )}
                </div>
              </div>

              {/* 本文 */}
              <div className="flex-grow flex flex-col min-h-[300px]">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">本文 (Body)</label>
                <textarea 
                  value={selectedTemplate.body || ''} 
                  onChange={e => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                  className="w-full h-full min-h-[300px] p-4 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none font-mono text-sm leading-relaxed resize-none shadow-inner bg-gray-50 focus:bg-white transition-colors"
                  placeholder="メール本文を入力... HTMLタグも使用可能です"
                />
              </div>
            </div>

            {/* フッターアクション */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center z-10">
              <div className="text-xs text-gray-400 font-mono">
                  {selectedTemplate.id ? `ID: ${selectedTemplate.id.substring(0, 8)}...` : 'Unsaved Draft'}
              </div>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className={`
                    px-6 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all
                    ${saving 
                        ? 'bg-gray-400 cursor-wait' 
                        : 'bg-gray-900 hover:bg-gray-800 shadow-md hover:shadow-lg hover:-translate-y-0.5'}
                `}
              >
                {saving ? <FiRefreshCw className="animate-spin"/> : <FiSave />}
                変更を保存
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FiCheckCircle size={40} className="mb-3 text-gray-200"/>
            <p className="text-sm font-medium">テンプレートを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}