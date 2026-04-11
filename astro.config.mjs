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

  // --- إضافة خاصية الـ Inline هنا ---
  build: {
    inlineStylesheets: 'always',
  },
  // -------------------------------

  adapter: cloudflare({
    imageService: { build: 'compile', runtime: 'cloudflare-binding' },
  }),

  integrations: [
    svelte(),
    //sitemap(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
        resolveUrl(url) {
          return url;
        },
        debug: false,
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
      // بما أنك استخدمت inlineStylesheets، يفضل ترك cssCodeSplit: false 
      // لدمج التنسيقات في ملف واحد ثم تضمينه داخل الـ HTML
      cssCodeSplit: true, 
      rollupOptions: {
        output: {
          assetFileNames: '_astro/[name].[hash][extname]',
          chunkFileNames: '_astro/[name].[hash].js',
          entryFileNames: '_astro/[name].[hash].js',
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
