import { getSitemapData, getFullSiteUrl, GENRES_LIST, CDN_URLS, getPrefix, formatDateWithOffset } from '../lib/constants';

/**
 * SCALABLE DYNAMIC SITEMAP ENGINE
 * Uses permanent numbering (sitemap-movies1.xml etc.) for stable indexing.
 */
export async function GET(context: any) {
  const { slug } = context.params;
  const currentSite = getFullSiteUrl(context);

  // Extract type and page number: e.g. 'movies1', 'pages1', 'series1'
  const match = slug.match(/^([a-z-]+?)(\d+)$/);
  if (!match) return new Response('Invalid Sitemap Param', { status: 404 });

  const [, typeKey, pageNumStr] = match;
  const page = parseInt(pageNumStr, 10);
  const ITEMS_PER_SITEMAP = 50000;

  let xmlContent = '';

  try {
    // -------------------------------------------------------
    // STATIC PAGES
    // -------------------------------------------------------
    if (typeKey === 'pages') {
      if (page > 1) return new Response('Range Out', { status: 404 });

      const urls = [
        `${currentSite}/`,
        `${currentSite}/movie`,
        `${currentSite}/tv`,
        `${currentSite}/categories`,
        `${currentSite}/search`,
        ...GENRES_LIST.map(g => `${currentSite}/movie/category/${g.slug}`),
        ...GENRES_LIST.map(g => `${currentSite}/tv/category/${g.slug}`),
      ];

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => `<url><loc>${escapeXml(u)}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`).join('\n  ')}
</urlset>`;
    }

    // -------------------------------------------------------
    // MOVIES
    // -------------------------------------------------------
    else if (typeKey === 'movies') {
      const all = await getSitemapData('movie', 45);
      const totalPages = Math.max(1, Math.ceil(all.length / ITEMS_PER_SITEMAP));
      if (page > totalPages) return new Response('Range Out', { status: 404 });

      const chunk = all.slice((page - 1) * ITEMS_PER_SITEMAP, page * ITEMS_PER_SITEMAP);
      const urls = chunk.map(item => {
        const pubDate = formatDateWithOffset(item.data.published);
        return `  <url>
    <loc>${escapeXml(`${currentSite}/movie/${item.data.slug}`)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
    }

    // -------------------------------------------------------
    // TV / SERIES
    // -------------------------------------------------------
    else if (typeKey === 'series' || typeKey === 'tv') {
      const all = await getSitemapData('tv', 45);
      const totalPages = Math.max(1, Math.ceil(all.length / ITEMS_PER_SITEMAP));
      if (page > totalPages) return new Response('Range Out', { status: 404 });

      const chunk = all.slice((page - 1) * ITEMS_PER_SITEMAP, page * ITEMS_PER_SITEMAP);
      const urls = chunk.map(item => {
        const pubDate = formatDateWithOffset(item.data.published);
        return `  <url>
    <loc>${escapeXml(`${currentSite}/tv/${item.data.slug}`)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
    }

    // -------------------------------------------------------
    // SEASONS
    // -------------------------------------------------------
    else if (typeKey === 'seasons') {
      const all = await getSitemapData('tv', 45);
      const totalPages = Math.max(1, Math.ceil(all.length / ITEMS_PER_SITEMAP));
      if (page > totalPages) return new Response('Range Out', { status: 404 });

      const chunk = all.slice((page - 1) * ITEMS_PER_SITEMAP, page * ITEMS_PER_SITEMAP);
      const urlLines: string[] = [];

      for (let i = 0; i < chunk.length; i++) {
        const t = chunk[i];
        const pubDate = formatDateWithOffset(t.data.published);
        const maxS = i < 5 ? 5 : 1;
        for (let s = 1; s <= maxS; s++) {
          urlLines.push(`  <url>
    <loc>${escapeXml(`${currentSite}/tv/${t.data.slug}/s${String(s).padStart(2,'0')}`)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
      }

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlLines.join('\n')}
</urlset>`;
    }

    // -------------------------------------------------------
    // EPISODES
    // -------------------------------------------------------
    else if (typeKey === 'episodes') {
      const all = await getSitemapData('tv', 45);
      const totalPages = Math.max(1, Math.ceil(all.length / ITEMS_PER_SITEMAP));
      if (page > totalPages) return new Response('Range Out', { status: 404 });

      const chunk = all.slice((page - 1) * ITEMS_PER_SITEMAP, page * ITEMS_PER_SITEMAP);
      const urlLines: string[] = [];

      for (let i = 0; i < chunk.length; i++) {
        const t = chunk[i];
        const pubDate = formatDateWithOffset(t.data.published);
        const maxE = i < 3 ? 40 : 25;
        for (let e = 1; e <= maxE; e++) {
          urlLines.push(`  <url>
    <loc>${escapeXml(`${currentSite}/watch/tv/${t.data.slug}/s01/e${e}`)}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
        }
      }

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlLines.join('\n')}
</urlset>`;
    }

    // -------------------------------------------------------
    // VIDEO SITEMAP
    // -------------------------------------------------------
    else if (typeKey === 'video') {
      const all = await getSitemapData('movie', 45);
      const totalPages = Math.max(1, Math.ceil(all.length / ITEMS_PER_SITEMAP));
      if (page > totalPages) return new Response('Range Out', { status: 404 });

      const chunk = all.slice((page - 1) * ITEMS_PER_SITEMAP, page * ITEMS_PER_SITEMAP);
      xmlContent = generateVideoXml(chunk, currentSite);
    }

    // -------------------------------------------------------
    // CAST SITEMAP
    // -------------------------------------------------------
    else if (typeKey === 'cast') {
      const movies = await getSitemapData('movie', 10);
      const tv     = await getSitemapData('tv', 10);
      const allItems = [...movies, ...tv];
      const castSet = new Set<string>();

      allItems.forEach(item => {
        if (Array.isArray(item.data.cast)) {
          item.data.cast.forEach((name: string) => {
            if (name && name.trim()) castSet.add(name.trim());
          });
        }
      });

      const sortedCast = Array.from(castSet).sort();
      const totalPages = Math.max(1, Math.ceil(sortedCast.length / ITEMS_PER_SITEMAP));
      if (page > totalPages) return new Response('Range Out', { status: 404 });

      const chunk = sortedCast.slice((page - 1) * ITEMS_PER_SITEMAP, page * ITEMS_PER_SITEMAP);

      // Generate URLs for both /movie/cast/ and /tv/cast/ for each actor
      const urlLines = chunk.flatMap(name => [
        `  <url>
    <loc>${escapeXml(`${currentSite}/movie/cast/${encodeURIComponent(name)}`)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
        `  <url>
    <loc>${escapeXml(`${currentSite}/tv/cast/${encodeURIComponent(name)}`)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
      ]);

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlLines.join('\n')}
</urlset>`;
    }

    else {
      return new Response('Unknown sitemap type', { status: 404 });
    }

    if (!xmlContent) return new Response('Empty Partition', { status: 404 });

    return new Response(xmlContent, {
      headers: {
        'Content-Type':  'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    });

  } catch (e) {
    console.error('Sitemap error:', e);
    return new Response('Sitemap Error', { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape special XML characters to prevent malformed XML */
function escapeXml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function generateVideoXml(items: any[], currentSite: string): string {
  const STATIC = 'https://static.ma3ak.top';
  const VIDEO  = 'https://s001.mogcdn.com';
  const getP   = (id: any) => id.toString().substring(0, 2);

  const entries = items.map((item: any) => {
    const id      = item.id;
    const prefix  = getP(id);
    const thumb   = `${STATIC}/movies/${prefix}/${id}/${id}.webp`;
    const pubDate = formatDateWithOffset(item.data.published);
    const title   = escapeXml(item.data.arabic_title || item.data.title || '');
    const year    = item.data.year || '2026';
    const isForeign = item.data.lang === 'en';
    const fullTitle = isForeign
      ? `فيلم ${title} ${year} مترجم كامل HD`
      : `مشاهدة فيلم ${title} ${year} كامل HD (معاك سيما)`;
    const rawDesc = item.data.overview
      ? item.data.overview.substring(0, 150) + '...'
      : `مشاهدة وتحميل فيلم ${title} اون لاين بجودة عالية HD كامل (معاك سيما)`;
    const description = escapeXml(rawDesc);

    return `  <url>
    <loc>${escapeXml(`${currentSite}/watch/movie/${item.data.slug}`)}</loc>
    <lastmod>${pubDate}</lastmod>
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumb)}</video:thumbnail_loc>
      <video:title>${fullTitle}</video:title>
      <video:description>${description}</video:description>
      <video:content_loc>${escapeXml(`${VIDEO}/movies/${prefix}/${id}/${id}.mp4`)}</video:content_loc>
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries}
</urlset>`;
}
