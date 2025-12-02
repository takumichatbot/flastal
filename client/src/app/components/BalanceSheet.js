"use client";
import React from 'react';

// クラスコンポーネントである必要があります（react-to-printの仕様）
export class BalanceSheet extends React.PureComponent {
  render() {
    const { project, totalExpense, balance } = this.props;
    const date = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <div className="p-12 bg-white text-gray-800 font-sans" style={{ minHeight: '297mm', width: '210mm' }}>
        {/* ヘッダー */}
        <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
          <h1 className="text-3xl font-bold mb-2">収支報告書</h1>
          <p className="text-sm text-gray-500">発行日: {date}</p>
        </div>

        {/* 企画情報 */}
        <div className="mb-8">
          <table className="w-full text-left">
            <tbody>
              <tr>
                <th className="py-2 w-32 text-gray-500">企画名</th>
                <td className="py-2 font-bold text-lg">{project.title}</td>
              </tr>
              <tr>
                <th className="py-2 text-gray-500">企画者</th>
                <td className="py-2">{project.planner?.handleName} 様</td>
              </tr>
              <tr>
                <th className="py-2 text-gray-500">開催日</th>
                <td className="py-2">{new Date(project.deliveryDateTime).toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* サマリー */}
        <div className="bg-gray-100 p-6 rounded-xl mb-10">
          <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-2">
            <span className="font-bold">収入合計 (支援総額)</span>
            <span className="text-xl font-bold">{project.collectedAmount.toLocaleString()} 円</span>
          </div>
          <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-2 text-red-600">
            <span className="font-bold">支出合計</span>
            <span className="text-xl font-bold">- {totalExpense.toLocaleString()} 円</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-lg">残高</span>
            <span className="text-2xl font-bold text-indigo-600">{balance.toLocaleString()} 円</span>
          </div>
        </div>

        {/* 明細テーブル */}
        <h3 className="text-lg font-bold border-l-4 border-indigo-500 pl-3 mb-4">支出明細</h3>
        <table className="w-full mb-12 border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="py-3 px-2 text-left w-12">No.</th>
              <th className="py-3 px-2 text-left">項目名</th>
              <th className="py-3 px-2 text-right">金額</th>
            </tr>
          </thead>
          <tbody>
            {project.expenses?.length > 0 ? (
              project.expenses.map((exp, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-2">{index + 1}</td>
                  <td className="py-3 px-2">{exp.itemName}</td>
                  <td className="py-3 px-2 text-right">{exp.amount.toLocaleString()} 円</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="py-6 text-center text-gray-400">支出の記録はありません</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* フッター */}
        <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>本報告書はクラウドファンディングプラットフォーム「FLASTAL」により自動生成されました。</p>
          <p>https://www.flastal.com</p>
        </div>
      </div>
    );
  }
}