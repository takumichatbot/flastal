import { redirect } from 'next/navigation';

export const metadata = {
  title: 'マイページ',
};

export default function IllustratorMyPage() {
  redirect('/mypage');
}
