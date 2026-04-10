/**
 * src/lib/seo/templates.ts
 * تعديل: روابط الممثلين تستخدم /cast/<n> بدلاً من /{type}/cast/<n>
 */
import { CDN_URLS, getPrefix, formatDateWithOffset } from '../constants';

export interface SeoMetadata { title: string; description: string; schema: any; ogType: string; }
export interface SeoItemInput {
  item: any; type: 'movie' | 'tv'; season?: string; episode?: string;
  siteUrl: string; currentUrl: string; isWatchPage: boolean;
}

const getArabicOrdinal = (n?: string) => {
  const ord: Record<number,string> = {
    1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',
    6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة',
    11:'الحادية عشر',12:'الثانية عشر',13:'الثالثة عشر',14:'الرابعة عشر',
    15:'الخامسة عشر',16:'السادسة عشر',17:'السابعة عشر',18:'الثامنة عشر',
    19:'التاسعة عشر',20:'العشرون',21:'الحادية والعشرون',22:'الثانية والعشرون',
    23:'الثالثة والعشرون',24:'الرابعة والعشرون',25:'الخامسة والعشرون',
    26:'السادسة والعشرون',27:'السابعة والعشرون',28:'الثامنة والعشرون',
    29:'التاسعة والعشرون',30:'الثلاثون',
  };
  return ord[parseInt(n||'1',10)] || n;
};
const cleanTitle = (s: string) => s ? s.replace(/\s*\(?\[?[0-9]{4}\)?\]?$/g,'').trim() : '';
const smart = (s: string, max: number) => s && s.length > max ? s.substring(0, max-3)+'...' : s;
const getPoster = (item: any, type: 'movie'|'tv') => {
  const prefix = getPrefix(item.id);
  return `${CDN_URLS.STATIC}/${type === 'movie' ? 'movies' : 'tv'}/${prefix}/${item.id}/${item.id}.webp`;
};
const getDates = (item: any) => {
  let ts = Number(item.data?.publish_date_timestamp || Date.now()/1000);
  if (ts > 9999999999) ts = ts/1000;
  return { pubDate: formatDateWithOffset(ts*1000), modDate: formatDateWithOffset() };
};

/** ✅ روابط الممثلين: /cast/<n> بدون type */
const castUrl = (siteUrl: string, name: string) =>
  `${siteUrl}/cast/${encodeURIComponent(name.trim())}`;

export const wrapMetadata = (m: { title:string; description:string; schema:any; ogType:string }) => {
  const brand = ' - معاك سيما';
  let t = m.title;
  if (!t.includes('معاك سيما')) {
    t = (t + brand).length > 65 ? smart(t, 65 - brand.length) + brand : t + brand;
  }
  return { ...m, title: smart(t, 65), description: smart(m.description, 155) };
};

export function arabicMovieTemplate(input: SeoItemInput): SeoMetadata {
  const { item, currentUrl, isWatchPage, siteUrl } = input;
  const title    = cleanTitle(item.data?.['title-ar'] || item.data?.arabic_title || item.data?.title || item.title);
  const year     = item.data?.year || '2026';
  const overview = item.data?.overview || item.overview || '';
  const slug     = item.data?.slug || item.slug || '';
  const { pubDate, modDate } = getDates(item);
  const poster   = getPoster(item, 'movie');
  const safe     = siteUrl || 'https://ma3ak.top';
  const cast     = Array.isArray(item.data?.cast) ? item.data.cast : [];

  const seoTitle    = isWatchPage ? `مشاهدة فيلم ${title} ${year} كامل HD` : `فيلم ${title} ${year} كامل HD`;
  const description = isWatchPage
    ? `مشاهدة وتحميل فيلم ${title} ${year} اون لاين بجودة عالية HD كامل ${overview}`
    : `مشاهدة فيلم ${title} اون لاين - ${overview}`;

  const schema: any = {
    "@context": "https://schema.org", "@type": ["WebPage","Movie"],
    "name": seoTitle, "url": currentUrl, "image": poster, "description": description,
    "inLanguage": "ar", "datePublished": pubDate, "dateModified": modDate,
    "genre": item.data?.genres || [],
    ...(item.data?.director && { "director": { "@type":"Person", "name": item.data.director } }),
    ...(cast.length > 0 && { "actor": cast.map((n: string) => ({ "@type":"Person","name":n, "url": castUrl(safe, n) })) }),
    "aggregateRating": { "@type":"AggregateRating","ratingValue":"8.5","reviewCount":"1200" },
    "video": { "@type":"VideoObject","name":seoTitle,"description":description,"thumbnailUrl":poster,"uploadDate":pubDate,"embedUrl":`${safe}/watch/movie/${slug}` },
  };

  return wrapMetadata({ title: seoTitle, description, schema, ogType: 'video.movie' });
}

export function foreignMovieTemplate(input: SeoItemInput): SeoMetadata {
  const { item, currentUrl, isWatchPage, siteUrl } = input;
  const eng  = cleanTitle(item.data?.title || item.title);
  const ar   = cleanTitle(item.data?.['title-ar'] || item.data?.arabic_title || '');
  const year = item.data?.year || '2026';
  const overview = item.data?.overview || item.overview || '';
  const slug = item.data?.slug || item.slug || '';
  const { pubDate, modDate } = getDates(item);
  const poster = getPoster(item, 'movie');
  const safe   = siteUrl || 'https://ma3ak.top';
  const cast   = Array.isArray(item.data?.cast) ? item.data.cast : [];
  const display = ar || eng;

  const seoTitle    = isWatchPage ? `مشاهدة فيلم ${display} ${year} مترجم` : `فيلم ${display} ${year} مترجم`;
  const description = isWatchPage
    ? `مشاهدة وتحميل فيلم ${display} (${eng}) ${year} مترجم اون لاين بجودة عالية HD كامل ${overview}`
    : `مشاهدة فيلم ${display} مترجم - ${eng} بجودة عالية HD اون لاين ${overview}`;

  const schema: any = {
    "@context":"https://schema.org","@type":["WebPage","Movie"],
    "name":seoTitle,"url":currentUrl,"image":poster,"description":description,
    "inLanguage":"en","datePublished":pubDate,"dateModified":modDate,
    "genre":item.data?.genres||[],
    ...(item.data?.director&&{"director":{"@type":"Person","name":item.data.director}}),
    ...(cast.length>0&&{"actor":cast.map((n:string)=>({ "@type":"Person","name":n,"url":castUrl(safe,n) }))}),
    "aggregateRating":{"@type":"AggregateRating","ratingValue":"8.5","reviewCount":"1200"},
    "video":{"@type":"VideoObject","name":seoTitle,"description":description,"thumbnailUrl":poster,"uploadDate":pubDate,"embedUrl":`${safe}/watch/movie/${slug}`},
  };

  return wrapMetadata({ title: seoTitle, description, schema, ogType: 'video.movie' });
}

export function arabicSeriesTemplate(input: SeoItemInput): SeoMetadata {
  const { item, currentUrl, isWatchPage, season, episode, siteUrl } = input;
  const title    = cleanTitle(item.data?.['title-ar'] || item.data?.arabic_title || item.data?.title || item.title);
  const year     = item.data?.year || '2026';
  const overview = item.data?.overview || item.overview || '';
  const { pubDate } = getDates(item);
  const poster   = getPoster(item, 'tv');
  const safe     = siteUrl || 'https://ma3ak.top';
  const cast     = Array.isArray(item.data?.cast) ? item.data.cast : [];

  let seoTitle = '', description = '', schema: any = {};

  if (isWatchPage && episode) {
    const sNum = parseInt(season||'1',10);
    const sStr = sNum > 1 ? ` الموسم ${sNum}` : '';
    seoTitle    = `مشاهدة مسلسل ${title}${sStr} الحلقة ${episode} ${getArabicOrdinal(episode)}`;
    description = `مشاهدة وتحميل مسلسل ${title} الحلقة ${episode} اون لاين ${overview}`;
    schema = { "@context":"https://schema.org","@type":["WebPage","TVEpisode"],"name":seoTitle,"url":currentUrl,"episodeNumber":parseInt(episode),"image":poster,
      ...(item.data?.director&&{"director":{"@type":"Person","name":item.data.director}}),
      ...(cast.length>0&&{"actor":cast.map((n:string)=>({ "@type":"Person","name":n,"url":castUrl(safe,n) }))}),
      "video":{"@type":"VideoObject","name":seoTitle,"description":description,"thumbnailUrl":poster,"uploadDate":pubDate,"embedUrl":currentUrl}
    };
  } else {
    seoTitle    = `مسلسل ${title} ${year} كامل`;
    description = `مشاهدة وتحميل جميع حلقات مسلسل ${title} الموسم الاول مسلسلات عربية ${year} على موقع معاك سيما`;
    schema = { "@context":"https://schema.org","@type":["WebPage","TVSeries"],"name":seoTitle,"url":currentUrl,"description":description,"image":poster,"startDate":pubDate,"genre":item.data?.genres||[],
      ...(item.data?.director&&{"director":{"@type":"Person","name":item.data.director}}),
      ...(cast.length>0&&{"actor":cast.map((n:string)=>({ "@type":"Person","name":n,"url":castUrl(safe,n) }))})
    };
  }

  return wrapMetadata({ title: seoTitle, description, schema, ogType: 'video.tv_show' });
}

export function foreignSeriesTemplate(input: SeoItemInput): SeoMetadata {
  const { item, currentUrl, isWatchPage, season, episode, siteUrl } = input;
  const eng  = cleanTitle(item.data?.title || item.title);
  const ar   = cleanTitle(item.data?.['title-ar'] || item.data?.arabic_title || '');
  const display = ar || eng;
  const year = item.data?.year || '2026';
  const overview = item.data?.overview || item.overview || '';
  const { pubDate } = getDates(item);
  const poster = getPoster(item, 'tv');
  const safe   = siteUrl || 'https://ma3ak.top';
  const cast   = Array.isArray(item.data?.cast) ? item.data.cast : [];

  let seoTitle = '', description = '', schema: any = {};

  if (isWatchPage && episode) {
    const sNum = parseInt(season||'1',10);
    const sStr = sNum > 1 ? ` الموسم ${sNum}` : ' الموسم الاول';
    seoTitle    = `مشاهدة مسلسل ${display}${sStr} الحلقة ${episode} مترجمة`;
    description = `مشاهدة وتحميل الحلقة ${episode} من مسلسل ${display} مترجم بجودة HD اون لاين ${overview}`;
    schema = { "@context":"https://schema.org","@type":["WebPage","TVEpisode"],"name":seoTitle,"url":currentUrl,"episodeNumber":parseInt(episode),"image":poster,
      ...(item.data?.director&&{"director":{"@type":"Person","name":item.data.director}}),
      ...(cast.length>0&&{"actor":cast.map((n:string)=>({ "@type":"Person","name":n,"url":castUrl(safe,n) }))}),
      "video":{"@type":"VideoObject","name":seoTitle,"description":description,"thumbnailUrl":poster,"uploadDate":pubDate,"embedUrl":currentUrl}
    };
  } else {
    seoTitle    = `مسلسل ${display} ${year} مترجم`;
    description = `مشاهدة وتحميل جميع حلقات مسلسل ${display} (${eng}) مترجم كامل بجودة HD اون لاين ${overview}`;
    schema = { "@context":"https://schema.org","@type":["WebPage","TVSeries"],"name":seoTitle,"url":currentUrl,"description":description,"image":poster,"startDate":pubDate,"genre":item.data?.genres||[],
      ...(item.data?.director&&{"director":{"@type":"Person","name":item.data.director}}),
      ...(cast.length>0&&{"actor":cast.map((n:string)=>({ "@type":"Person","name":n,"url":castUrl(safe,n) }))})
    };
  }

  return wrapMetadata({ title: seoTitle, description, schema, ogType: 'video.tv_show' });
}
