// app/florists/pending/page.js
'use client';

export default function PendingApprovalPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ご登録ありがとうございます
        </h2>
        <p className="text-gray-600">
          ただいま登録内容の審査を行っております。
          <br />
          承認まで今しばらくお待ちください。
        </p>
        <div className="mt-6 text-sm">
          <a href="/" className="font-medium text-sky-600 hover:underline">
            トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}