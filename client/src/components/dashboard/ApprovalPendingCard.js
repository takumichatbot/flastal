'use client';

import { FiClock, FiInfo } from 'react-icons/fi';

export default function ApprovalPendingCard() {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
      <div className="bg-orange-100 p-4 rounded-full">
        <FiClock className="text-4xl text-orange-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-orange-800 mb-2">審査待ちステータスです</h3>
        <p className="text-sm text-orange-700 leading-relaxed max-w-md">
          現在、運営事務局にてアカウント情報の確認を行っております。<br/>
          審査が完了するまで、一部の機能（案件への応募など）が制限されています。<br/>
          通常1〜3営業日以内に審査結果をメールにてお知らせいたします。
        </p>
      </div>
      <div className="flex items-start gap-2 text-xs text-orange-600 bg-white/50 p-3 rounded border border-orange-100 text-left">
        <FiInfo className="mt-0.5 shrink-0" />
        <span>プロフィールの編集は可能です。実績写真などを充実させてお待ちください。</span>
      </div>
    </div>
  );
}