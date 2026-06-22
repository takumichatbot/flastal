'use client';

import { useState } from 'react';
import { FileCheck, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const STATUS_LABELS = {
    NONE:     { label: '未提出',   color: 'bg-slate-100 text-slate-500' },
    PENDING:  { label: '審査中',   color: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: '承認済み', color: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: '却下',     color: 'bg-red-100 text-red-600' },
};

export default function KycUpload({ kycStatus }) {
    const { authenticatedFetch } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const s = STATUS_LABELS[kycStatus] || STATUS_LABELS.NONE;

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            // まず S3 にアップロード
            const fd = new FormData();
            fd.append('image', file);
            const uploadRes = await authenticatedFetch(`${API_URL}/api/tools/upload`, { method: 'POST', body: fd });
            const { url } = await uploadRes.json();

            // KYC 申請
            const r = await authenticatedFetch(`${API_URL}/api/users/kyc/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentUrl: url }),
            });
            const d = await r.json();
            if (!r.ok) { toast.error(d.message); return; }
            toast.success(d.message);
            setSubmitted(true);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FileCheck size={17} className="text-slate-400" />
                    <h3 className="text-sm font-black text-slate-800">本人確認 (KYC)</h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                累計出金10万pt超の場合、運転免許証・マイナンバーカードなど顔写真付き身分証の提出が必要です。
            </p>
            {(kycStatus === 'NONE' || kycStatus === 'REJECTED') && !submitted && (
                <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-indigo-600 transition-colors">
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                    {uploading ? 'アップロード中...' : '書類をアップロード'}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            )}
            {(kycStatus === 'PENDING' || submitted) && (
                <div className="flex items-center gap-2 text-amber-600 text-xs font-black">
                    <CheckCircle2 size={14} /> 審査中です。1〜3営業日でご連絡します。
                </div>
            )}
            {kycStatus === 'APPROVED' && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-black">
                    <CheckCircle2 size={14} /> 本人確認が完了しています。
                </div>
            )}
        </div>
    );
}
