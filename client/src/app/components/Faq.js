// components/Faq.js (サンプル)

'use client';
import { useState } from 'react';

const allFaqs = [
  {
    question: '手数料はかかりますか？',
    answer:
      'FLASTALでは、安心して企画を楽しみ、成功させていただくために、全ての取引においてプラットフォーム手数料をいただいております。\n\n【支援者様】\n支援するポイント額の10%が手数料となります。この手数料には、安全な決済システムの利用料だけでなく、ToDoリストや収支報告、参加者限定チャットといった企画運営を円滑にするためのツールの利用料、そして万が一企画が中止になった際の全額返金保証などが含まれています。皆様が安心して「応援したい」気持ちを形にできる環境を提供するための料金です。\n\n【お花屋さん】\n成立した企画の売上から10%を手数料としていただいております。初期費用や月額費用は一切かからず、新しいお客様と出会う機会を提供します。企画者様との円滑なコミュニケーションツールや安全な決済システムをご利用いただけます。',
  },
  {
    question: 'ポイントの有効期限はありますか？',
    answer:
      'FLASTALのポイントに有効期限はありません。あなたの「応援したい」という気持ちを、いつでも好きな時に形にできるよう、無期限でご利用いただけます。安心してポイントをご購入ください。',
  },
  {
    question: 'もし企画が中止になったら、支援したポイントはどうなりますか？',
    answer:
      'ご安心ください。企画が中止になった場合、その企画に支援したポイントは手数料など一切引かれることなく、全額あなたのアカウントに返還されます。安心して企画を応援してください。',
  },
  {
    question: '企画が目標を達成した後はどうなりますか？',
    answer:
      '目標達成おめでとうございます！企画者は集まったポイントを使ってお花屋さんとデザインの相談や支払いを行います。企画が無事に完了した後、企画ページには主催者から完成したお花の写真が投稿される「完成報告」機能があります。参加者全員で感動を分かち合いましょう！',
  },
  // ... もし他に既存のFAQがあればここに追加 ...
];


function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="py-6">
      <dt>
        <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-start justify-between text-left text-gray-900">
          <span className="text-base font-semibold leading-7">{question}</span>
          <span className="ml-6 flex h-7 items-center">
            {isOpen ? 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg> : 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
            }
          </span>
        </button>
      </dt>
      {isOpen && (
        <dd className="mt-2 pr-12">
          <p className="text-base leading-7 text-gray-600 whitespace-pre-wrap">{answer}</p>
        </dd>
      )}
    </div>
  );
}

export default function Faq() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">よくある質問</h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {allFaqs.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}