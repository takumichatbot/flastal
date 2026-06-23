import ShopPageClient from './ShopPageClient';

export const metadata = {
  title: '花屋向け資材ショップ',
  description: 'フラワースタンド制作に必要な花材・資材・梱包材を仕入れられる花屋さん向けショップ。¥10,000以上で送料無料。',
  openGraph: {
    title: '花屋向け資材ショップ',
    description: 'フラワースタンド制作に必要な花材・資材・梱包材を仕入れられる花屋さん向けショップ。',
    url: 'https://www.flastal.com/shop',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'FLASTAL 花屋向け資材ショップ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '花屋向け資材ショップ',
    description: 'フラワースタンド制作に必要な花材・資材・梱包材を仕入れられる花屋さん向けショップ。',
    images: ['/og-default.png'],
  },
};

export default function ShopPage() {
  return <ShopPageClient />;
}
