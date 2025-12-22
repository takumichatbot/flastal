'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FiPrinter, FiArrowLeft, FiFileText, FiAlertCircle, 
  FiHelpCircle, FiCheckSquare 
} from 'react-icons/fi';

export default function TermsOfServicePage() {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      
      {/* ヘッダーナビゲーション */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-sky-600 transition-colors">
          <FiArrowLeft className="mr-1" /> トップページに戻る
        </Link>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
        >
          <FiPrinter /> 規約を保存/印刷
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-100">
        
        {/* タイトルエリア */}
        <div className="border-b border-slate-200 pb-6 mb-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-sky-50 p-3 rounded-full">
                <FiFileText className="text-4xl text-sky-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            利用規約
          </h1>
          <p className="text-sm text-slate-500">
            この利用規約は、FLASTALの利用に関する条件を定めるものです。
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-600">
          
          {/* 前文 */}
          <section>
            <p>
              この利用規約（以下、「本規約」といいます。）は、FLASTAL（以下、「当社」といいます。）がこのウェブサイト上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
            </p>
          </section>

          {/* 条文リスト */}
          <div className="space-y-8">
            
            <Article title="第1条（適用）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</li>
                <li>当社は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下、「個別規定」といいます。）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。</li>
                <li>本規約の規定が前項の個別規定の規定と矛盾する場合には、個別規定において特段の定めなき限り、個別規定の規定が優先されるものとします。</li>
              </ol>
            </Article>

            <Article title="第2条（利用登録）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
                <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                  <ul className="list-disc list-outside pl-5 mt-1 space-y-1 text-slate-500">
                    <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                    <li>本規約に違反したことがある者からの申請である場合</li>
                    <li>その他、当社が利用登録を相当でないと判断した場合</li>
                  </ul>
                </li>
              </ol>
            </Article>

            <Article title="第3条（ユーザーIDおよびパスワードの管理）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
                <li>ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。当社は、ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。</li>
                <li>ユーザーID及びパスワードが第三者によって使用されたことによって生じた損害は、当社に故意又は重大な過失がある場合を除き、当社は一切の責任を負わないものとします。</li>
              </ol>
            </Article>

            <Article title="第4条（利用料金および支払方法）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>ユーザーは、本サービスの有料部分（クラウドファンディング支援等）の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。</li>
                <li>ユーザーが利用料金の支払を遅滞した場合には、ユーザーは年14.6％の割合による遅延損害金を支払うものとします。</li>
              </ol>
            </Article>

            <Article title="第5条（禁止事項）">
              <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800">
                <ul className="grid md:grid-cols-2 gap-2 list-none text-xs md:text-sm">
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 法令または公序良俗に違反する行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 犯罪行為に関連する行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 本サービスの内容等、著作権等を侵害する行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 当社、ほかのユーザー等のサーバー負担をかける行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 商業目的で本サービスを利用する行為（許可を除く）</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 不正なアクセスやこれを試みる行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 他のユーザーに関する情報を収集または蓄積する行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 不正な目的を持って本サービスを利用する行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 他のユーザーに成りすます行為</li>
                  <li className="flex items-center"><FiAlertCircle className="mr-2 shrink-0"/> 反社会的勢力に対して利益を供与する行為</li>
                </ul>
              </div>
            </Article>

            <Article title="第6条（本サービスの提供の停止等）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                  <ul className="list-disc list-outside pl-5 mt-1 space-y-1 text-slate-500">
                    <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                    <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                    <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                    <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                  </ul>
                </li>
                <li>当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
              </ol>
            </Article>

            <Article title="第7条（利用制限および登録抹消）">
              <p>
                当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
              </p>
              <ul className="list-disc list-outside pl-5 mt-2 space-y-1 text-slate-500">
                <li>本規約のいずれかの条項に違反した場合</li>
                <li>登録事項に虚偽の事実があることが判明した場合</li>
                <li>料金等の支払債務の不履行があった場合</li>
                <li>当社からの連絡に対し、一定期間返答がない場合</li>
                <li>本サービスについて、最終の利用から一定期間利用がない場合</li>
                <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
              </ul>
            </Article>

            <Article title="第8条（退会）">
              <p>ユーザーは、当社の定める退会手続を経て、本サービスから退会できるものとします。</p>
            </Article>

            <Article title="第9条（保証の否認および免責事項）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
                <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。</li>
                <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
              </ol>
            </Article>

            <Article title="第10条（サービス内容の変更等）">
              <p>当社は、ユーザーへの事前の通知をすることなく、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。</p>
            </Article>

            <Article title="第11条（利用規約の変更）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
                  <ul className="list-disc list-outside pl-5 mt-1 space-y-1 text-slate-500">
                    <li>本規約の変更がユーザーの一般の利益に適合するとき。</li>
                    <li>本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。</li>
                  </ul>
                </li>
                <li>当社はユーザーに対し、前項による本規約の変更にあたり、事前に、本規約を変更する旨及び変更後の本規約の内容並びにその効力発生時期を通知します。</li>
              </ol>
            </Article>

            <Article title="第12条（個人情報の取扱い）">
              <p>当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。</p>
            </Article>

            <Article title="第13条（通知または連絡）">
              <p>ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。</p>
            </Article>

            <Article title="第14条（権利義務の譲渡の禁止）">
              <p>ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。</p>
            </Article>

            <Article title="第15条（準拠法・裁判管轄）">
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
              </ol>
            </Article>

          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-right text-sm text-slate-500">
            <p>制定日: 2025年9月26日</p>
            <p>改定日: 2025年12月17日</p>
          </div>

          {/* フッターお問い合わせ */}
          <div className="mt-8 text-center bg-slate-50 p-6 rounded-xl border border-slate-200">
            <p className="text-slate-600 mb-4 font-bold">規約に関するご質問・お問い合わせ</p>
            <Link 
              href="/contact" 
              className="inline-flex items-center px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-full hover:bg-slate-50 hover:border-sky-400 hover:text-sky-600 transition-colors shadow-sm"
            >
              <FiHelpCircle className="mr-2" /> お問い合わせフォーム
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

// 条文コンポーネント (再利用用)
function Article({ title, children }) {
  return (
    <section className="scroll-mt-20">
      <h2 className="text-lg font-bold text-slate-800 flex items-center mb-3 border-l-4 border-sky-500 pl-3">
        {title}
      </h2>
      <div className="text-slate-600 leading-7">
        {children}
      </div>
    </section>
  );
}