const BASE = 'https://www.flastal.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

async function fetchJson(path) {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date().toISOString();

  // 静的ページ
  const staticPages = [
    { url: BASE,                               changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/projects`,                 changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/florists`,                 changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/events`,                   changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/artists`,                  changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/ranking`,                  changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/illustrators`,             changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/illustrators/recruitment`, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/guide`,                    changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`,                    changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/login`,                    changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/register`,                 changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/gallery`,                  changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/status`,                   changeFrequency: 'hourly',  priority: 0.5 },
    { url: `${BASE}/terms`,                    changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`,                  changeFrequency: 'yearly',  priority: 0.3 },
  ].map(p => ({ ...p, lastModified: now }));

  // 動的: 公開プロジェクト
  const projects = await fetchJson('/api/projects?limit=500');
  const projectPages = (Array.isArray(projects) ? projects : projects?.projects || []).map(p => ({
    url: `${BASE}/projects/${p.id}`,
    lastModified: p.updatedAt || now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 動的: 承認済み花屋
  const florists = await fetchJson('/api/florists?limit=500');
  const floristPages = (Array.isArray(florists) ? florists : florists?.florists || []).map(f => ({
    url: `${BASE}/florists/${f.id}`,
    lastModified: f.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 動的: イベント
  const events = await fetchJson('/api/events?limit=200');
  const eventPages = (Array.isArray(events) ? events : events?.events || []).map(e => ({
    url: `${BASE}/events/${e.id}`,
    lastModified: e.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // 動的: アーティストページ
  const artists = await fetchJson('/api/artists');
  const artistPages = (Array.isArray(artists) ? artists : []).map(a => ({
    url: `${BASE}/artists/${a.slug}`,
    lastModified: a.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...projectPages, ...floristPages, ...eventPages, ...artistPages];
}
