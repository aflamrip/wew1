import { getSitemapData, getFullSiteUrl, CDN_URLS, getPrefix, formatDateWithOffset } from '../lib/constants';

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

export async function GET(context: any) {
  const currentSite = getFullSiteUrl(context);
  const now = formatDateWithOffset();

  const movies = await getSitemapData('movie', 2);
  const series = await getSitemapData('tv', 2);
  const allItems = [...movies.slice(0, 15), ...series.slice(0, 15)];

  const entries = allItems.map((item: any) => {
    const isMovie    = item.data.type === 'movie' || !item.data.type?.includes('tv');
    const typePath   = isMovie ? 'movies' : 'tv';
    const routeType  = isMovie ? 'movie' : 'tv';
    const thumbUrl   = `${CDN_URLS.STATIC}/${typePath}/${getPrefix(item.id)}/${item.id}/${item.id}.webp`;
    const itemUrl    = `${currentSite}/${routeType}/${item.data.slug}`;
    const title      = escapeXml(item.data.title || '');
    const overview   = escapeXml(item.data.overview || `مشاهدة ${item.data.title} على معاك سيما.`);

    const castNames  = Array.isArray(item.data.cast) ? item.data.cast : [];
    const castLinks  = castNames
      .map((name: string) =>
        `<a href="${escapeXml(`${currentSite}/${routeType}/cast/${encodeURIComponent(name.trim())}`)}">${escapeXml(name)}</a>`
      )
      .join('، ');
    const directorHtml = item.data.director
      ? `<p><b>إخراج:</b> ${escapeXml(item.data.director)}</p>`
      : '';
    const castHtml = castLinks ? `<p><b>طاقم العمل:</b> ${castLinks}</p>` : '';

    return `  <entry>
    <title>${title}</title>
    <link href="${escapeXml(itemUrl)}" />
    <id>${escapeXml(itemUrl)}</id>
    <updated>${now}</updated>
    <summary>${overview}</summary>
    <author><name>معاك سيما</name></author>
    <content type="html"><![CDATA[<img src="${thumbUrl}" alt="${item.data.title || ''}" /><br/>${directorHtml}${castHtml}<p>${item.data.overview || ''}</p>]]></content>
  </entry>`;
  }).join('\n');

  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>معاك سيما - أحدث الإضافات</title>
  <subtitle>مشاهدة الأفلام والمسلسلات أون لاين</subtitle>
  <link href="${escapeXml(`${currentSite}/atom.xml`)}" rel="self" />
  <link href="${escapeXml(`${currentSite}/`)}" />
  <id>${escapeXml(`${currentSite}/`)}</id>
  <updated>${now}</updated>
  <author><name>معاك سيما</name></author>
${entries}
</feed>
`;

  return new Response(atom, {
    headers: {
      'Content-Type':  'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
