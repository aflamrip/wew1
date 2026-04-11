// src/pages/sitemap-cast-[page].xml.ts
import type { APIRoute } from 'astro';
import { getSitemapData, getFullSiteUrl } from '../lib/constants';

const ITEMS_PER_SITEMAP = 500;

export const GET: APIRoute = async (context) => {
  const { page } = context.params;
  const pageNum = parseInt(page || '1', 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return new Response('Not Found', { status: 404 });
  }

  const siteUrl = getFullSiteUrl(context);

  // Collect all unique cast members
  const [movieData, tvData] = await Promise.all([
    getSitemapData('movie', 45),
    getSitemapData('tv', 45),
  ]);

  // Build a Map: actorName → Set of content types found in
  const castMap = new Map<string, { movie: boolean; tv: boolean }>();

  for (const item of movieData) {
    const cast: string[] = Array.isArray(item.data?.cast) ? item.data.cast : [];
    for (const actor of cast) {
      if (typeof actor !== 'string' || !actor.trim()) continue;
      const key = actor.trim();
      const existing = castMap.get(key) || { movie: false, tv: false };
      existing.movie = true;
      castMap.set(key, existing);
    }
  }
  for (const item of tvData) {
    const cast: string[] = Array.isArray(item.data?.cast) ? item.data.cast : [];
    for (const actor of cast) {
      if (typeof actor !== 'string' || !actor.trim()) continue;
      const key = actor.trim();
      const existing = castMap.get(key) || { movie: false, tv: false };
      existing.tv = true;
      castMap.set(key, existing);
    }
  }

  const castEntries = Array.from(castMap.entries());
  const totalPages  = Math.max(1, Math.ceil(castEntries.length / ITEMS_PER_SITEMAP));

  if (pageNum > totalPages) {
    return new Response('Not Found', { status: 404 });
  }

  const start = (pageNum - 1) * ITEMS_PER_SITEMAP;
  const slice = castEntries.slice(start, start + ITEMS_PER_SITEMAP);
  const now   = new Date().toISOString();

  // For each actor generate URLs based on which content types they appear in
  const urlLines: string[] = [];

  for (const [actorName, types] of slice) {
    const encoded = encodeURIComponent(actorName);

    // Prefer the broader movie cast page first if actor is in both
    if (types.movie) {
      urlLines.push(`  <url>
    <loc>${siteUrl}/movie/cast/${encoded}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
    if (types.tv) {
      urlLines.push(`  <url>
    <loc>${siteUrl}/tv/cast/${encoded}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlLines.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
};
