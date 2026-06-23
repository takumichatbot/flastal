'use client';
import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, ChevronLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const SETTINGS = [
  {
    category: 'プッシュ通知',
    icon: Smartphone,
    items: [
      { key: 'push_new_pledge', label: '支援があったとき', desc: 'あなたの企画に新しい支援が入ったとき' },
      { key: 'push_project_complete', label: 'フラスタが完成したとき', desc: '支援した企画が完成したとき' },
      { key: 'push_live_start', label: 'ライブ配信が始まったとき', desc: '支援した企画の制作中継が開始したとき' },
      { key: 'push_group_buy_funded', label: 'グループ購入が成立したとき', desc: '参加したグループ購入が目標口数に達したとき' },
    ],
  },
  {
    category: 'メール通知',
    icon: Mail,
    items: [
      { key: 'email_pledge_received', label: '支援受領メール', desc: '企画への支援が入ったときに送信' },
      { key: 'email_project_funded', label: '目標達成メール', desc: '企画が目標金額を達成したときに送信' },
      { key: 'email_project_complete', label: 'フラスタ完成メール', desc: '支援した企画が完成したときに送信' },
      { key: 'email_digest', label: '日次ダイジェストメール', desc: '未読通知を毎朝まとめてメールでお届けします' },
    ],
  },
];

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('authToken')?.replace(/^"|"$/g, '') || localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    fetch(`${API_URL}/api/users/notification-settings`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {});
    fetch(`${API_URL}/api/users/push-subscriptions`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setDevices(d) : null)
      .catch(() => {});
  }, []);

  const removeDevice = async (id) => {
    try {
      await fetch(`${API_URL}/api/users/push-subscriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(prev => prev.filter(d => d.id !== id));
      toast.success('デバイスの登録を解除しました');
    } catch {
      toast.error('解除に失敗しました');
    }
  };

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success('通知設定を保存しました');
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mypage" className="text-slate-500 hover:text-slate-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Bell size={18} className="text-pink-500" />
          通知設定
        </h1>
      </div>

      <div className="space-y-6">
        {SETTINGS.map(({ category, icon: Icon, items }) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold text-slate-600">{category}</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
              {items.map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${settings[key] ? 'bg-pink-500' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {devices.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-600">プッシュ通知を受信するデバイス</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
            {devices.map(d => (
              <div key={d.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{d.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    登録日: {new Date(d.createdAt).toLocaleDateString('ja-JP')} · ...{d.endpointSuffix}
                  </p>
                </div>
                <button
                  onClick={() => removeDevice(d.id)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
                >
                  <Trash2 size={13} />
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-8 w-full bg-pink-500 text-white font-black py-3 rounded-2xl hover:bg-pink-600 disabled:opacity-50 transition-colors"
      >
        {saving ? '保存中...' : '設定を保存'}
      </button>
    </div>
  );
}
