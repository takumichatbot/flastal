import UserProfileClient from './UserProfileClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const DEFAULT_IMAGE = 'https://www.flastal.com/opengraph-image.png';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/users/${id}/profile`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'ユーザー' };
    const user = await res.json();
    const name = user.handleName || 'FLASTALユーザー';
    const bio = user.bio ? user.bio.slice(0, 120) : `${name} さんのFLASTALプロフィール`;
    const image = user.iconUrl || DEFAULT_IMAGE;
    return {
      title: name,
      description: bio,
      openGraph: {
        title: `${name} | FLASTAL`,
        description: bio,
        images: [{ url: image, width: 400, height: 400 }],
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: `${name} | FLASTAL`,
        description: bio,
        images: [image],
      },
    };
  } catch {
    return { title: 'ユーザー' };
  }
}

export default function UserProfilePage() {
  return <UserProfileClient />;
}
