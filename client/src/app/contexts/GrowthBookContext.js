'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { GrowthBook } from '@growthbook/growthbook';

const GB_API_HOST = process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST || 'https://cdn.growthbook.io';
const GB_CLIENT_KEY = process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || '';

const GrowthBookContext = createContext(null);

export function GrowthBookProvider({ children, userId }) {
    const [gb, setGb] = useState(null);

    useEffect(() => {
        if (!GB_CLIENT_KEY) {
            // GrowthBook が未設定の場合はデフォルト（実験なし）で初期化
            const instance = new GrowthBook({ enableDevMode: process.env.NODE_ENV === 'development' });
            setGb(instance);
            return () => instance.destroy();
        }

        const instance = new GrowthBook({
            apiHost:    GB_API_HOST,
            clientKey:  GB_CLIENT_KEY,
            enableDevMode: process.env.NODE_ENV === 'development',
            attributes: { id: userId || 'anonymous', url: window.location.href },
            trackingCallback: (experiment, result) => {
                // GA4 や独自 analytics に送れる
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'experiment_viewed', {
                        experiment_id: experiment.key,
                        variant_id: result.variationId,
                    });
                }
            },
        });

        instance.loadFeatures({ autoRefresh: true }).then(() => setGb(instance));
        return () => instance.destroy();
    }, [userId]);

    return (
        <GrowthBookContext.Provider value={gb}>
            {children}
        </GrowthBookContext.Provider>
    );
}

export const useGrowthBook = () => useContext(GrowthBookContext);

// 特定フィーチャーフラグを返すフック
export function useFeature(featureKey) {
    const gb = useGrowthBook();
    if (!gb) return { value: null, on: false };
    const result = gb.evalFeature(featureKey);
    return { value: result.value, on: !!result.value };
}

// A/B テストのバリエーションを返すフック
export function useExperiment(experimentKey, variations) {
    const gb = useGrowthBook();
    if (!gb || !variations?.length) return variations?.[0] ?? null;
    const result = gb.run({ key: experimentKey, variations });
    return result.value;
}
