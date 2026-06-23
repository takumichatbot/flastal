'use client';
import { useState, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OrganizerMessagesPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    // 自分が主催者のプロジェクト一覧を取得
    fetch(`${API_URL}/api/projects?myPlanned=true`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setProjects(Array.isArray(d) ? d : d.projects || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProject || !token) {
      setTiers([]);
      setSelectedTier('');
      return;
    }
    fetch(`${API_URL}/api/projects/${selectedProject}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setTiers(Array.isArray(d.pledgeTiers) ? d.pledgeTiers : []);
        setSelectedTier('');
      })
      .catch(() => {});
  }, [selectedProject, token]);

  const handleSend = async () => {
    if (!selectedProject) return toast.error('送信先の企画を選択してください');
    if (!subject.trim()) return toast.error('件名を入力してください');
    if (!message.trim()) return toast.error('メッセージを入力してください');
    setSending(true);
    try {
      const body = { subject, message };
      if (selectedTier) body.tierId = selectedTier;
      const res = await fetch(`${API_URL}/api/projects/${selectedProject}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setSubject('');
        setMessage('');
      } else {
        toast.error(data.message || '送信に失敗しました');
      }
    } catch {
      toast.error('通信エラーが発生しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Send size={20} className="text-pink-500" />
        支援者への一斉メッセージ
      </h1>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
        <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          送信したメッセージは全支援者にメールと通知で届きます。送信後の取り消しはできません。
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1.5 block">送信先の企画</label>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option value="">企画を選択...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {selectedProject && (
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">送信対象のティア（省略時は全支援者）</label>
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="">全ての支援者</option>
              {tiers.map(t => (
                <option key={t.id} value={t.id}>{t.name}（¥{t.amount?.toLocaleString()}）</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 mb-1.5 block">件名</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="例：制作が完了しました！"
            maxLength={100}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 mb-1.5 block">メッセージ（2000文字以内）</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="支援者へのメッセージを入力..."
            maxLength={2000}
            rows={8}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
          />
          <p className="text-xs text-slate-400 text-right mt-1">{message.length}/2000</p>
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-pink-500 text-white font-black py-3.5 rounded-2xl hover:bg-pink-600 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
        >
          <Send size={18} />
          {sending ? '送信中...' : selectedTier ? `${tiers.find(t => t.id === selectedTier)?.name || 'ティア'}の支援者に送信` : '全支援者に送信'}
        </button>
      </div>
    </div>
  );
}
