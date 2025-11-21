'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiDollarSign, FiZap } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

/**
 * 成功企画テンプレート選択モーダル
 * @param {function} onClose - モーダルを閉じる関数
 * @param {function} onSelect - テンプレートが選択されたときに呼び出される関数
 */
export default function SuccessTemplateModal({ onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/successful-templates`);
        if (!res.ok) throw new Error('成功企画データの取得に失敗しました。');
        
        const data = await res.json();
        setTemplates(data);
      } catch (err) {
        setError(err.message);
        toast.error('テンプレートの読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <ModalLayout onClose={onClose}>
        <div className="text-center py-10">テンプレートを読み込み中...</div>
      </ModalLayout>
    );
  }

  if (error || templates.length === 0) {
    return (
      <ModalLayout onClose={onClose}>
        <div className="text-center py-10 text-red-600">
          {error || 'まだ利用できる成功テンプレートがありません。'}
        </div>
      </ModalLayout>
    );
  }

  return (
    <ModalLayout onClose={onClose} title="✨ 成功企画テンプレートを選択">
      <p className="text-sm text-gray-600 mb-4">
        過去に目標を達成し完了した企画のデータを参考に、あなたの企画を始めましょう。選択すると、タイトル、目標金額、デザイン詳細が自動で入力されます。
      </p>
      
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {templates.map((template) => (
          <div key={template.id} className="p-4 border rounded-lg shadow-sm bg-white hover:border-sky-400 transition-all">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{template.title}</h3>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <FiCheckCircle className="w-4 h-4 mr-1 text-green-500" />
                達成額: {template.totalPledged.toLocaleString()} pt
              </span>
              <span className="flex items-center">
                <FiDollarSign className="w-4 h-4 mr-1 text-yellow-500" />
                目標額: {template.totalTarget.toLocaleString()} pt
              </span>
              <span className="flex items-center">
                <FiZap className="w-4 h-4 mr-1 text-pink-500" />
                費用総計: {template.expenseSummary.toLocaleString()} pt
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-3 border-l-2 pl-2 italic">
              「{template.designSummary}」
            </p>
            
            <button 
              onClick={() => onSelect(template)} 
              className="w-full py-2 text-sm font-semibold text-white bg-sky-500 rounded-md hover:bg-sky-600 transition-colors"
            >
              このテンプレートで始める
            </button>
          </div>
        ))}
      </div>
    </ModalLayout>
  );
}

// モーダルの共通レイアウト
const ModalLayout = ({ children, onClose, title = "テンプレート選択" }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-50 p-6 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{title}</h2>
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
        >
            &times;
        </button>
        {children}
      </div>
    </div>
);