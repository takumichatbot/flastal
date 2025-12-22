"use client";
import React from 'react';

// クラスコンポーネントである必要があります（react-to-printの仕様）
export class BalanceSheet extends React.PureComponent {
  render() {
    const { project, totalExpense, balance } = this.props;
    const date = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    // A4サイズ (210mm x 297mm) を想定したスタイル
    const pageStyle = {
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      backgroundColor: '#ffffff',
      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif', // 明朝体でフォーマルに
      color: '#333',
      position: 'relative',
      boxSizing: 'border-box'
    };

    return (
      <div style={pageStyle}>
        
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-end border-b-2 border-gray-800 pb-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-gray-900">収支報告書</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Balance Sheet</p>
          </div>
          <div className="text-right text-sm">
            <p>発行日: {date}</p>
            <p className="text-gray-500 text-xs mt-1">ID: {project.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* 企画概要 */}
        <div className="mb-12">
          <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-3 mb-4 bg-gray-50 py-1">企画概要</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="py-3 w-32 text-left font-normal text-gray-500">企画名</th>
                <td className="py-3 font-bold text-lg">{project.title}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left font-normal text-gray-500">主催者</th>
                <td className="py-3">{project.planner?.handleName} 様</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left font-normal text-gray-500">実施日</th>
                <td className="py-3">{new Date(project.deliveryDateTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left font-normal text-gray-500">会場</th>
                <td className="py-3">{project.venue?.venueName || project.deliveryAddress || '未定'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 収支サマリー */}
        <div className="mb-12">
          <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-3 mb-4 bg-gray-50 py-1">収支要約</h2>
          <div className="border border-gray-800 p-6 flex justify-between items-center bg-white shadow-sm">
            <div className="text-center w-1/3 border-r border-gray-200">
              <p className="text-xs text-gray-500 mb-1">収入合計</p>
              <p className="text-xl font-bold">{project.collectedAmount.toLocaleString()}<span className="text-sm font-normal ml-1">円</span></p>
            </div>
            <div className="text-center w-1/3 border-r border-gray-200">
              <p className="text-xs text-gray-500 mb-1">支出合計</p>
              <p className="text-xl font-bold text-red-600">▲ {totalExpense.toLocaleString()}<span className="text-sm font-normal ml-1">円</span></p>
            </div>
            <div className="text-center w-1/3">
              <p className="text-xs text-gray-500 mb-1">最終残高</p>
              <p className="text-2xl font-bold text-gray-900">{balance.toLocaleString()}<span className="text-sm font-normal ml-1">円</span></p>
            </div>
          </div>
        </div>

        {/* 支出明細テーブル */}
        <div className="mb-10">
          <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-3 mb-4 bg-gray-50 py-1">支出明細</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-t border-b border-gray-800">
                <th className="py-2 px-4 text-left w-16">No.</th>
                <th className="py-2 px-4 text-left">項目 / 摘要</th>
                <th className="py-2 px-4 text-right w-40">金額 (円)</th>
              </tr>
            </thead>
            <tbody>
              {project.expenses?.length > 0 ? (
                project.expenses.map((exp, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="py-3 px-4 text-center text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4">{exp.itemName}</td>
                    <td className="py-3 px-4 text-right font-mono">{exp.amount.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-10 text-center text-gray-400">支出の記録はありません</td>
                </tr>
              )}
              {/* 合計行 */}
              <tr className="border-t-2 border-gray-800">
                <td colSpan="2" className="py-3 px-4 text-right font-bold">合計</td>
                <td className="py-3 px-4 text-right font-bold font-mono text-lg">{totalExpense.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 備考・余剰金の使い道 */}
        {balance > 0 && (
            <div className="mb-12 border border-dashed border-gray-400 p-4 rounded bg-gray-50">
                <h3 className="text-sm font-bold mb-2">【余剰金の取り扱いについて】</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {project.surplusUsageDescription || '次回の企画への繰り越し、または主催者への一任とさせていただきます。'}
                </p>
            </div>
        )}

        {/* フッター / 電子印鑑風装飾 */}
        <div className="absolute bottom-10 left-0 right-0 px-20">
            <div className="flex justify-between items-end border-t border-gray-300 pt-4">
                <div className="text-xs text-gray-400">
                    <p>Powered by FLASTAL</p>
                    <p>https://www.flastal.com</p>
                </div>
                
                {/* 運営の承認印風スタンプ */}
                <div className="relative border-2 border-red-500 text-red-500 w-20 h-20 rounded-full flex flex-col items-center justify-center transform -rotate-12 opacity-80">
                    <span className="text-[10px] border-b border-red-500 w-16 text-center">FLASTAL</span>
                    <span className="font-bold text-lg my-1">済</span>
                    <span className="text-[10px] border-t border-red-500 w-16 text-center">{date}</span>
                </div>
            </div>
        </div>

      </div>
    );
  }
}