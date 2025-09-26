// components/Faq.js (サンプル)

'use client';
import { useState } from 'react';

const allFaqs = [
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