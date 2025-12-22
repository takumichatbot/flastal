'use client';

import { useState } from 'react';
import { FiChevronDown, FiHelpCircle, FiInfo } from 'react-icons/fi';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "目標金額に届かなかった場合、企画はどうなりますか？",
      a: "企画者が「All-in方式」を選択している場合は、目標金額に届かなくても集まった資金でフラスタが贈られます。「All-or-Nothing方式」の場合は、企画は不成立となり、支援金は全額返金されます。"
    },
    {
      q: "匿名で支援することはできますか？",
      a: "はい、可能です。支援時に「ゲスト支援」を選択するか、ログイン後にニックネームを設定することで、本名を公開せずに企画に参加できます。"
    },
    {
      q: "支払い方法は何がありますか？",
      a: "クレジットカード（Visa, MasterCard, JCB, Amex）がご利用いただけます。決済はStripeを通じて安全に処理され、カード情報はサイト上に保存されません。"
    },
    {
      q: "企画者へのメッセージはいつ送られますか？",
      a: "支援時に入力したメッセージは、即座に企画詳細ページの「支援者メッセージ」欄に反映されます。企画者や他の参加者も見ることができます。"
    },
    {
      q: "お花屋さんを自分で指定することはできますか？",
      a: "企画者が「お花屋さんを探す」機能を使って特定のお花屋さんにオファーを出すことができます。または、ご自身で外部のお花屋さんに手配し、FLASTALは集金ツールとしてのみ利用することも可能です。"
    }
  ];

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-sky-100 text-sky-600 rounded-full mb-4">
            <FiHelpCircle size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">よくある質問</h2>
          <p className="text-gray-500 mt-2 text-sm">FLASTALのご利用について、よくいただくご質問をまとめました。</p>
        </div>

        {/* アコーディオンリスト */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-sky-200 shadow-md' : 'border-gray-200 shadow-sm hover:border-sky-100'}`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className={`font-bold text-lg flex gap-3 ${isOpen ? 'text-sky-600' : 'text-gray-800'}`}>
                    <span className="text-sky-500 shrink-0">Q.</span>
                    {faq.q}
                  </span>
                  <FiChevronDown 
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-500' : 'text-gray-400'}`} 
                    size={24} 
                  />
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 mx-5 mt-2">
                    <div className="flex gap-3 pt-4">
                        <span className="text-gray-400 shrink-0 font-bold">A.</span>
                        {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* お問い合わせリンク */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">解決しない場合は、こちらからお問い合わせください。</p>
          <a 
            href="mailto:support@flastal.jp" 
            className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 hover:text-sky-600 transition-colors shadow-sm"
          >
            <FiInfo className="mr-2" /> お問い合わせ窓口へ
          </a>
        </div>

      </div>
    </section>
  );
}