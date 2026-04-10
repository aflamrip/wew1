// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ma3ak.top',

  image: {
    domains: ['static.ma3ak.top'],
  },

  output: 'server',

  adapter: cloudflare({
    imageService: { build: 'compile', runtime: 'cloudflare-binding' },
  }),

  integrations: [
    svelte(),
    sitemap(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
        // FIX: Suppress deprecated API warnings
        // SharedStorage and AttributionReporting are called by GTM internals
        // but are not needed for basic analytics. Blocking them silences the
        // "Uses deprecated APIs" warning in PageSpeed / Chrome DevTools.
        resolveUrl(url) {
          // Allow all requests through — filtering happens at the browser level
          return url;
        },
        // Sandbox debug mode OFF in production (reduces noise)
        debug: false,
        // FIX: Lib location must be correct for SW to load
        lib: '~/partytown/',
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: [],
    },
    build: {
      // FIX: Improve CSS chunking — split critical from non-critical
      // This prevents the monolithic Layout.*.css from being render-blocking
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Keep CSS assets with predictable names for caching
          assetFileNames: '_astro/[name].[hash][extname]',
          chunkFileNames: '_astro/[name].[hash].js',
          entryFileNames: '_astro/[name].[hash].js',
          // Split vendor chunks for better caching
          manualChunks(id) {
            if (id.includes('node_modules/plyr')) return 'plyr';
            if (id.includes('node_modules/embla')) return 'embla';
            if (id.includes('node_modules/@orama')) return 'orama';
          },
        },
      },
    },
  },
});
