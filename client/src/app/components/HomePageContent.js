'use client';

import React from 'react';
import Link from 'next/link';

// アイコンやアニメーションを一旦削除した簡易版
export default function HomePageContent() {
  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-block px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-bold">
          デバッグモード
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900">
          FLASTAL
        </h1>
        <p className="text-xl text-slate-600">
          現在、表示のテストを行っています。<br/>
          この画面が見えている場合、ホームページのコンポーネント自体は正常に動作しています。
        </p>
        
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
          <p className="font-bold text-slate-900">考えられる原因：</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>アニメーションライブラリ(Framer Motion)のバージョン不整合</li>
            <li>アイコンライブラリ(Lucide React)の読み込みエラー</li>
            <li>ブラウザのメモリ不足</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center pt-6">
          <Link href="/projects" className="px-6 py-3 bg-sky-500 text-white rounded-lg font-bold hover:bg-sky-600">
            企画一覧へ
          </Link>
          <Link href="/create" className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
            企画を作成
          </Link>
        </div>
      </div>
    </div>
  );
}