'use client';

import { FiClock, FiMail, FiAward, FiUser, FiXCircle, FiMapPin, FiCalendar, FiLogOut, FiHelpCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

export default function ApprovalPendingCard() {
    const { user, logout } = useAuth();
    
    // ロールごとの設定情報
    const roleConfig = {
        'FLORIST': {
            label: 'お花屋さん',
            description: 'あなたの素敵なアレンジメントを届けるために、ポートフォリオや資格情報を確認させていただいています。',
            benefitTitle: '承認されると...',
            benefit: '全国のファンからの制作オファーを受けたり、自慢の制作事例をポートフォリオとして公開できるようになります。',
            icon: <FiAward size={24} />,
            colorClass: 'bg-pink-50 text-pink-700 border-pink-200',
            iconBg: 'bg-white text-pink-500'
        },
        'VENUE': {
            label: '会場・ホール',
            description: '安全なイベント運営のために、ご登録いただいた会場設備や搬入レギュレーションを確認中です。',
            benefitTitle: '承認されると...',
            benefit: '公式レギュレーションの掲載・編集や、開催イベント情報の紐付け管理が可能になり、搬入トラブルを未然に防げます。',
            icon: <FiMapPin size={24} />,
            colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
            iconBg: 'bg-white text-blue-500'
        },
        'ORGANIZER': {
            label: 'イベント主催者',
            description: '信頼できるイベント情報を提供するため、主催者情報を確認させていただいています。',
            benefitTitle: '承認されると...',
            benefit: '公式イベントページの作成や、フラスタの受入可否（OK/NG）を一括設定し、ファンへの周知を自動化できます。',
            icon: <FiCalendar size={24} />,
            colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
            iconBg: 'bg-white text-purple-500'
        },
        'default': {
            label: 'アカウント',
            description: 'アカウント情報を確認中です。',
            benefitTitle: '承認されると...',
            benefit: 'すべての機能がご利用いただけるようになります。',
            icon: <FiUser size={24} />,
            colorClass: 'bg-gray-50 text-gray-700 border-gray-200',
            iconBg: 'bg-white text-gray-500'
        }
    };
    
    const config = roleConfig[user?.role] || roleConfig['default'];
    const isRejected = user?.status === 'REJECTED'; 

    // ステータスに応じたテーマカラー設定
    const statusTheme = isRejected ? {
        bg: 'bg-red-50',
        text: 'text-red-900',
        subText: 'text-red-700',
        border: 'border-red-100',
        iconColor: 'text-red-500',
        mainIcon: <FiXCircle className="w-16 h-16 text-red-500" />
    } : {
        bg: 'bg-yellow-50',
        text: 'text-yellow-900',
        subText: 'text-yellow-700',
        border: 'border-yellow-100',
        iconColor: 'text-yellow-500',
        mainIcon: <FiClock className="w-16 h-16 text-yellow-500" />
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                
                {/* ヘッダーエリア */}
                <div className={`${statusTheme.bg} p-10 text-center border-b ${statusTheme.border}`}>
                    <div className="mx-auto w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        {statusTheme.mainIcon}
                    </div>
                    
                    <h1 className={`text-3xl font-extrabold ${statusTheme.text} mb-3`}>
                        {isRejected ? '審査結果のお知らせ' : '現在、承認待ちです'}
                    </h1>
                    <p className={`font-bold ${statusTheme.subText} text-sm uppercase tracking-wider`}>
                        {config.label} アカウント
                    </p>
                </div>

                {/* メインコンテンツエリア */}
                <div className="p-8 md:p-12 space-y-10">
                    
                    <div className="text-center space-y-4">
                        <p className="text-gray-600 leading-relaxed text-lg">
                            {isRejected ? (
                                <>
                                    誠に残念ながら、ご登録いただいたアカウント情報は<br/>
                                    <strong>当サービスの承認基準を満たしませんでした。</strong>
                                </>
                            ) : (
                                <>
                                    ご登録ありがとうございます。<br/>
                                    {config.description}
                                </>
                            )}
                        </p>
                        
                        {!isRejected && (
                            <p className="text-sm text-gray-400 font-medium">
                                通常、<span className="text-yellow-600 font-bold border-b border-yellow-300">3営業日以内</span>にメールにて結果をご連絡いたします。
                            </p>
                        )}
                        
                        {isRejected && (
                            <div className="p-4 bg-red-50 rounded-xl text-sm text-red-700 text-left border border-red-100">
                                <p className="font-bold mb-1 flex items-center"><FiMail className="mr-2"/> 結果通知メールをご確認ください</p>
                                詳細な理由につきましては、ご登録のメールアドレスにお送りした通知をご確認ください。ご不明な点はサポートまでお問い合わせください。
                            </div>
                        )}
                    </div>

                    {/* 承認後のメリット表示 (待機中のみ) */}
                    {!isRejected && (
                        <div className={`p-6 rounded-2xl border ${config.colorClass} flex items-start gap-5 shadow-sm`}>
                            <div className={`p-4 rounded-full shadow-sm shrink-0 ${config.iconBg}`}>
                                {config.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    {config.benefitTitle}
                                </h3>
                                <p className="text-sm leading-relaxed opacity-90">
                                    {config.benefit}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* アクションボタン */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 border-t border-gray-100">
                        <button 
                            onClick={logout}
                            className="flex items-center px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors w-full sm:w-auto justify-center"
                        >
                            <FiLogOut className="mr-2"/> ログアウト
                        </button>
                        
                        <a 
                            href="mailto:support@flastal.jp" 
                            className="flex items-center px-6 py-3 text-sky-600 font-bold hover:bg-sky-50 rounded-xl transition-colors w-full sm:w-auto justify-center"
                        >
                            <FiHelpCircle className="mr-2"/> お問い合わせ
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}