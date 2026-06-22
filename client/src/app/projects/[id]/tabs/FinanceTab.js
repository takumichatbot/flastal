'use client';
import { DollarSign, Printer, Trash2 } from 'lucide-react';
import { AppCard } from './shared.js';

export default function FinanceTab({ ctx }) {
  const {
    project, isPlanner,
    totalExpense, balance,
    expenseName, setExpenseName,
    expenseAmount, setExpenseAmount,
    handleAddExpense, handleDeleteExpense,
    handlePrint,
    componentRef, BalanceSheet,
  } = ctx;

  return (
    <div className="space-y-4 md:space-y-6">
      <AppCard className="!p-5 md:!p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center">
            <DollarSign className="mr-1.5 text-slate-400" size={18} /> 収支報告
          </h2>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-[10px] md:text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Printer size={12} /> PDF保存
          </button>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl text-xs md:text-sm space-y-2 md:space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold">収入 (支援総額)</span>
            <span className="font-black text-sm md:text-base text-slate-800">{project.collectedAmount.toLocaleString()} pt</span>
          </div>
          <div className="flex justify-between items-center text-rose-500">
            <span className="font-bold">支出合計</span>
            <span className="font-black text-sm md:text-base">- {totalExpense.toLocaleString()} pt</span>
          </div>
          <div className="h-px bg-slate-200 my-2" />
          <div className="flex justify-between items-center">
            <span className="font-black text-slate-800">残高 (余剰金)</span>
            <span className="text-lg md:text-xl font-black text-slate-900">{balance.toLocaleString()} pt</span>
          </div>
        </div>
      </AppCard>

      {/* 印刷用（非表示） */}
      {BalanceSheet && (
        <div style={{ display: 'none' }}>
          <BalanceSheet ref={componentRef} project={project} totalExpense={totalExpense} balance={balance} />
        </div>
      )}

      <AppCard className="!p-5 md:!p-8">
        <h3 className="font-black text-slate-800 mb-3 text-sm md:text-base">支出の内訳</h3>
        {isPlanner && (
          <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2 mb-4 bg-slate-50 p-2.5 rounded-lg">
            <input
              type="text" value={expenseName} onChange={(e) => setExpenseName(e.target.value)}
              placeholder="項目名 (例: パネル代)"
              className="p-2.5 border border-transparent rounded-md flex-grow text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-300"
            />
            <input
              type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="金額"
              className="p-2.5 border border-transparent rounded-md w-full sm:w-28 text-xs font-bold focus:outline-none focus:bg-white focus:border-slate-300"
            />
            <button type="submit" className="p-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-xs font-black w-full sm:w-auto">追加</button>
          </form>
        )}
        <div className="space-y-1.5">
          {project.expenses?.map(e => (
            <div key={e.id} className="flex justify-between items-center text-xs md:text-sm bg-slate-50 p-3 rounded-lg">
              <span className="font-black text-slate-700">{e.itemName}</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-800">{e.amount.toLocaleString()} pt</span>
                {isPlanner && (
                  <button onClick={() => handleDeleteExpense(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {(!project.expenses || project.expenses.length === 0) && (
            <p className="text-center text-slate-400 text-xs font-bold py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              支出はまだ登録されていません
            </p>
          )}
        </div>
      </AppCard>
    </div>
  );
}
