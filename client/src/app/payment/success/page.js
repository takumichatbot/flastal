// client/src/app/payment/success/page.js
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 text-center">
      <h1 className="text-4xl font-bold text-green-800 mb-4">決済ありがとうございます！</h1>
      <p className="text-lg text-gray-700 mb-8">ポイントの購入処理が完了しました。</p>
      <Link href="/">
        <span className="px-6 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer">
          トップページに戻る
        </span>
      </Link>
    </div>
  );
}
