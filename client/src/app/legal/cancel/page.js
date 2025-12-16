import React from 'react';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">キャンセル・返金ポリシー</h1>

        <div className="prose prose-pink max-w-none text-gray-700 space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              1. キャンセル料の発生基準
            </h2>
            <p>
              企画成立後のお客様都合によるキャンセル（企画中止）は、お花のお届け予定日（納品日）を起算日として、以下のキャンセル料が発生します。
            </p>
            <div className="overflow-hidden border rounded-lg mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">キャンセル申請日</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">キャンセル料率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">お届け7日前まで</td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-bold">無料 <span className="text-gray-400 font-normal text-xs ml-1">(※特注資材費を除く)</span></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">お届け6日前 〜 4日前</td>
                    <td className="px-6 py-4 text-sm text-orange-600 font-bold">ご支援総額の 50%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">お届け3日前 〜 当日</td>
                    <td className="px-6 py-4 text-sm text-red-600 font-bold">ご支援総額の 100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
            <h2 className="text-lg font-bold text-yellow-800 flex items-center mb-3">
              <FiAlertTriangle className="mr-2"/> 2. 特注資材費の実費請求
            </h2>
            <p className="text-sm text-yellow-900">
              キャンセル申請の時期に関わらず、以下の製作がすでにお花屋さんによって開始・発注されている場合は、<strong>その実費を全額</strong>キャンセル料として加算請求いたします。
            </p>
            <ul className="list-disc list-inside mt-3 text-sm text-yellow-900 space-y-1 ml-2">
              <li>パネル類（お名札パネル、イラストパネル、等身大パネル等）の印刷・加工費</li>
              <li>特注バルーン（名入れ済み）、特殊リボン等の資材費</li>
              <li>特殊な花材（染めバラなど）の仕入れ確定分</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. 参加者（支援者）様への返金について</h2>
            <p>企画が中止となった場合、参加者様への返金は以下の通り行います。</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-2">
              <li><strong>全額返金の場合：</strong>キャンセル料が発生しない期間の中止であれば、システム利用料を除いた支援額全額をポイント等で返還いたします。</li>
              <li><strong>一部返金の場合：</strong>発生したキャンセル料を差し引いた残額を、各支援者様の支援額に応じて按分（プロラタ方式）し返還いたします。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. レギュレーション未確認について</h2>
            <p>
              イベント主催者が発表する「フラワースタンド規定（レギュレーション）」を確認せずに注文し、結果として会場での受け取り拒否やお持ち帰りを命じられた場合、<strong>代金の100%を請求し、返金は一切行いません</strong>。
            </p>
          </section>

          <div className="mt-8 pt-8 border-t text-sm text-gray-500">
            <p>ご不明な点がございましたら、お問い合わせフォームよりご連絡ください。</p>
            <p className="mt-2">最終改定日：2025年12月17日</p>
          </div>

        </div>
      </div>
    </div>
  );
}