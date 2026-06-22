import { notFound } from 'next/navigation';
import ArtistPageClient from './ArtistPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const res = await fetch(`${API_URL}/api/artists/${slug}`, { next: { revalidate: 3600 } });
        if (!res.ok) return { title: 'アーティスト | FLASTAL' };
        const artist = await res.json();
        return {
            title: `${artist.name} | FLASTAL`,
            description: artist.description || `${artist.name}への応援フラスタ企画一覧`,
            openGraph: {
                title: `${artist.name} | FLASTAL`,
                images: artist.coverImageUrl ? [{ url: artist.coverImageUrl }] : [],
            },
        };
    } catch {
        return { title: 'アーティスト | FLASTAL' };
    }
}

export default async function ArtistPage({ params }) {
    const { slug } = await params;
    const res = await fetch(`${API_URL}/api/artists/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) notFound();
    const artist = await res.json();

    const projectsRes = await fetch(`${API_URL}/api/artists/${slug}/projects`, { next: { revalidate: 300 } });
    const projects = projectsRes.ok ? await projectsRes.json() : [];

    return <ArtistPageClient artist={artist} projects={projects} />;
}
