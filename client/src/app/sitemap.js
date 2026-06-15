export default function sitemap() {
  const base = 'https://www.flastal.com';
  const now = new Date().toISOString();

  return [
    { url: base,                               lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/projects`,                 lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/events`,                   lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/illustrators`,             lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/illustrators/recruitment`, lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/florists`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/login`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/register`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/points`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/terms`,                    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacy`,                  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
