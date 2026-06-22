'use client';

function parseVideoUrl(url) {
    if (!url) return null;

    // YouTube: youtu.be/<id> or youtube.com/watch?v=<id> or youtube.com/shorts/<id>
    const ytShort = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    const ytWatch = url.match(/youtube\.com\/(?:watch\?v=|shorts\/)([A-Za-z0-9_-]{11})/);
    const ytId = (ytShort || ytWatch)?.[1];
    if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0`;

    // Vimeo: vimeo.com/<id>
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;

    return null;
}

export default function VideoEmbed({ url, className = '' }) {
    const embedUrl = parseVideoUrl(url);
    if (!embedUrl) return null;

    return (
        <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black ${className}`}>
            <iframe
                src={embedUrl}
                title="動画"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
            />
        </div>
    );
}
