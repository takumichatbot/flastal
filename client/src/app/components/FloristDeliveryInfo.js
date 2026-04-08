// src/app/components/FloristDeliveryInfo.js
'use client';

import React from 'react';
import { Truck, MapPin, Package, Info, AlertCircle } from 'lucide-react';

export default function FloristDeliveryInfo({ deliverySettings }) {
    if (!deliverySettings) return null;

    const { baseArea, baseFee, collectionType, collectionFee, areaFees, conditionFees } = deliverySettings;

    // 回収費の表示テキストを生成
    let collectionText = '';
    let collectionColor = '';
    switch (collectionType) {
        case 'INCLUDED':
            collectionText = '配送料に含む（追加請求なし）';
            collectionColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
            break;
        case 'FREE':
            collectionText = '完全無料（送料・回収費ともに0円）';
            collectionColor = 'text-sky-600 bg-sky-50 border-sky-200';
            break;
        case 'PAID':
            collectionText = `別途請求：${collectionFee?.toLocaleString()}円`;
            collectionColor = 'text-amber-600 bg-amber-50 border-amber-200';
            break;
        default:
            collectionText = '要相談';
            collectionColor = 'text-slate-600 bg-slate-50 border-slate-200';
    }

    // エリア・条件追加料金の配列が空かどうか
    const hasAreaFees = Array.isArray(areaFees) && areaFees.length > 0;
    const hasConditionFees = Array.isArray(conditionFees) && conditionFees.length > 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <Truck className="text-slate-500" size={20} />
                <h3 className="font-black text-slate-800">配送料金・回収費の目安</h3>
            </div>

            <div className="p-6 space-y-6">
                
                {/* 1. 基本設定と回収費 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                            <MapPin size={14} /> 基本配送エリア
                        </p>
                        <p className="font-bold text-slate-800">{baseArea}</p>
                        <p className="text-xl font-black text-sky-600 mt-2">
                            {baseFee === 0 ? '無料' : `${baseFee.toLocaleString()}円`}
                        </p>
                    </div>

                    <div className={`rounded-xl p-4 border ${collectionColor}`}>
                        <p className="text-xs font-bold mb-1 opacity-70 flex items-center gap-1">
                            <AlertCircle size={14} /> イベント終了後のフラスタ回収
                        </p>
                        <p className="font-bold">{collectionText}</p>
                    </div>
                </div>

                {/* 2. 追加料金（あれば表示） */}
                {(hasAreaFees || hasConditionFees) && (
                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Package className="text-slate-400" size={16} /> その他の追加料金（該当する場合）
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* エリア別 */}
                            {hasAreaFees && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400">特定のエリアへの配達</p>
                                    <ul className="space-y-2">
                                        {areaFees.map((fee, idx) => (
                                            <li key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                                <span className="text-slate-700">{fee.areaName}</span>
                                                <span className="font-bold text-slate-900">+{fee.extraFee?.toLocaleString()}円</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 条件別 */}
                            {hasConditionFees && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400">サイズ・時間などの条件</p>
                                    <ul className="space-y-2">
                                        {conditionFees.map((fee, idx) => (
                                            <li key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                                <span className="text-slate-700">{fee.conditionName}</span>
                                                <span className="font-bold text-slate-900">+{fee.extraFee?.toLocaleString()}円</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                <div className="bg-sky-50 rounded-lg p-3 flex items-start gap-2 text-xs text-sky-700">
                    <Info className="shrink-0 mt-0.5" size={14} />
                    <p>
                        実際の配送料金・回収費は、会場の規定やスケジュールによって変動する場合があります。<br/>
                        正確な金額は、見積もり（Quotation）の際に「内訳」として提示されます。
                    </p>
                </div>
            </div>
        </div>
    );
}