import { notFound } from 'next/navigation';
import ArtistPageClient from './ArtistPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const res = await fetch(`${API_URL}/api/artists/${slug}`, { next: { revalidate: 300 } });
        if (!res.ok) return { title: 'アーティスト | FLASTAL' };
        const artist = await res.json();
        const title = `${artist.artistName || artist.name} | FLASTAL`;
        const description = artist.description || `${artist.artistName || artist.name}のフラスタ企画一覧。FLASTALでフラワースタンドを贈ろう。`;
        const image = artist.coverImageUrl || artist.iconUrl || 'https://www.flastal.com/og-default.png';
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                url: `https://www.flastal.com/artists/${slug}`,
                images: [{ url: image, width: 1200, height: 630, alt: artist.artistName || artist.name }],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [image],
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

    const eventsRes = await fetch(`${API_URL}/api/events?artistSlug=${slug}&upcoming=true`, { next: { revalidate: 300 } });
    const eventsData = eventsRes.ok ? await eventsRes.json() : [];
    const events = Array.isArray(eventsData) ? eventsData : (eventsData?.events ?? []);

    return <ArtistPageClient artist={artist} projects={projects} events={events} />;
}
