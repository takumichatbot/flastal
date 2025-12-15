// src/app/components/ApprovalPendingCard.js
'use client';

import { FiClock, FiMail, FiAward, FiUser, FiXCircle, FiMapPin, FiCalendar } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

export default function ApprovalPendingCard() {
    const { user, logout } = useAuth();
    
    // ロールに基づいた情報設定
    const roleInfo = {
        'FLORIST': {
            title: 'お花屋さんアカウント',
            message: 'あなたの制作事例や資格情報などを確認中です。',
            action: 'プロフィールが承認され次第、オファーの受信や制作事例の公開が可能になります。',
            icon: <FiAward className="w-8 h-8 text-pink-600"/>
        },
        'VENUE': {
            title: '会場アカウント',
            message: 'ご登録いただいた会場情報（レギュレーションなど）を運営が確認中です。',
            action: '承認され次第、公式レギュレーションの編集やイベントの紐付けが可能になります。',
            icon: <FiMapPin className="w-8 h-8 text-blue-600"/>
        },
        'ORGANIZER': {
            title: 'イベント主催者アカウント',
            message: '主催者情報の確認中です。',
            action: '承認され次第、公式イベント情報の登録・管理が可能になります。',
            icon: <FiCalendar className="w-8 h-8 text-purple-600"/>
        },
        'USER': {
            title: '一般ユーザー',
            message: 'このメッセージは一般ユーザーには表示されません。',
            action: '',
            icon: <FiUser className="w-8 h-8 text-gray-600"/>
        }
    };
    
    const info = roleInfo[user?.role] || roleInfo.USER;
    const isRejected = user?.status === 'REJECTED'; // REJECTED ステータスもチェック

    return (
        <div className="max-w-xl mx-auto p-8 mt-12 bg-white rounded-2xl shadow-2xl border-t-4 border-yellow-500">
            
            <div className="flex items-start gap-4 mb-6">
                {isRejected ? (
                    <FiXCircle className="w-10 h-10 text-red-600"/>
                ) : (
                    <FiClock className="w-10 h-10 text-yellow-600"/>
                )}
                
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{info.title}</h1>
                    <p className={`text-3xl font-extrabold mt-1 ${isRejected ? 'text-red-600' : 'text-yellow-600'}`}>
                        {isRejected ? 'アカウントは却下されました' : '現在、承認待ちです'}
                    </p>
                </div>
            </div>

            <div className="space-y-4 border-t pt-4">
                <p className="text-lg text-gray-700">
                    {isRejected ? (
                        <>
                            残念ながら、ご登録いただいたアカウントは**承認基準を満たしませんでした**。詳細は運営事務局からのメールをご確認ください。
                        </>
                    ) : (
                        <>
                            ご登録ありがとうございます。{info.message}
                            通常、**3営業日以内**にメールにて結果をご連絡いたします。
                        </>
                    )}
                </p>
                
                {!isRejected && (
                    <p className="text-md text-gray-600 border-l-4 border-pink-200 pl-3 py-1">
                        **承認が完了するまで、一部の機能はご利用いただけません。**<br/>
                        {info.action}
                    </p>
                )}
                
                {isRejected && (
                    <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800">
                        <FiMail className="inline mr-1"/>
                        ご不明な点はお問い合わせ窓口までご連絡ください。
                    </div>
                )}
                
            </div>
            
            <div className="mt-8 text-center">
                <button 
                    onClick={logout}
                    className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                    ログアウト
                </button>
            </div>
        </div>
    );
}