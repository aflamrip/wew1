/**
 * src/lib/cf-image.ts
 *
 * Cloudflare Image Resizing helper.
 * All image requests are routed through:
 *   https://ma3ak.top/cdn-cgi/image/{options}/{original_url}
 *
 * Docs: https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */

export type CfImageFit = 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
export type CfImageFormat = 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';

export interface CfImageOptions {
  width?: number;
  height?: number;
  fit?: CfImageFit;
  quality?: number;       // 1–100, default 85
  format?: CfImageFormat; // default 'auto' (serves WebP/AVIF to supported browsers)
  sharpen?: number;       // 0–10
  blur?: number;          // 1–250
  dpr?: number;           // device pixel ratio
}

const SITE_ORIGIN = 'https://ma3ak.top';
const CDN_CGI_BASE = `${SITE_ORIGIN}/cdn-cgi/image`;

/**
 * Build a Cloudflare Image Resizing URL.
 *
 * @example
 * cfImage('https://static.ma3ak.top/movies/20/2097884/2097884.webp', { width: 300, quality: 80 })
 * // → https://ma3ak.top/cdn-cgi/image/width=300,quality=80,format=auto/https://static.ma3ak.top/movies/20/2097884/2097884.webp
 */
export function cfImage(originalUrl: string, opts: CfImageOptions = {}): string {
  // During local dev (non-CF environment) return original URL unchanged
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development'
  ) {
    return originalUrl;
  }

  const params: string[] = [];

  if (opts.width)   params.push(`width=${opts.width}`);
  if (opts.height)  params.push(`height=${opts.height}`);
  if (opts.fit)     params.push(`fit=${opts.fit}`);
  if (opts.quality) params.push(`quality=${opts.quality}`);
  if (opts.sharpen) params.push(`sharpen=${opts.sharpen}`);
  if (opts.blur)    params.push(`blur=${opts.blur}`);
  if (opts.dpr)     params.push(`dpr=${opts.dpr}`);

  // Always add format=auto so CF serves WebP/AVIF to capable browsers
  params.push(`format=${opts.format ?? 'auto'}`);

  const optString = params.join(',');
  return `${CDN_CGI_BASE}/${optString}/${originalUrl}`;
}

// ---------------------------------------------------------------------------
// Preset helpers — use these across the project for consistent sizing
// ---------------------------------------------------------------------------

/** Poster card (2:3 ratio) — used in grids */
export function posterUrl(originalUrl: string, width = 300): string {
  return cfImage(originalUrl, {
    width,
    height: Math.round(width * 1.5),
    fit: 'cover',
    quality: 80,
  });
}

/** Hero poster (detail page, larger) */
export function heroPosterUrl(originalUrl: string): string {
  return cfImage(originalUrl, {
    width: 400,
    height: 600,
    fit: 'cover',
    quality: 85,
  });
}

/** OG / share image — 1200×630 */
export function ogImageUrl(originalUrl: string): string {
  return cfImage(originalUrl, {
    width: 1200,
    height: 630,
    fit: 'cover',
    quality: 85,
  });
}

/** Thumbnail used in search results */
export function thumbUrl(originalUrl: string): string {
  return cfImage(originalUrl, {
    width: 80,
    height: 120,
    fit: 'cover',
    quality: 75,
  });
}

// ---------------------------------------------------------------------------
// Static CDN helper
// ---------------------------------------------------------------------------

const STATIC_BASE = 'https://static.ma3ak.top';
const INFO_BASE   = 'https://static.mogcdn.com';

/** Build the standard poster URL for an item */
export function buildPosterUrl(type: 'movies' | 'tv', id: string): string {
  const prefix = id.toString().substring(0, 2);
  return `${STATIC_BASE}/${type}/${prefix}/${id}/${id}.webp`;
}

/**
 * Build the .info.webp URL used for social sharing
 * Source: static.mogcdn.com/{type}/{prefix}/{id}/{id}.info.webp
 */
export function buildInfoImageUrl(type: 'movies' | 'tv', id: string): string {
  const prefix = id.toString().substring(0, 2);
  return `${INFO_BASE}/${type}/${prefix}/${id}/${id}.info.webp`;
}
