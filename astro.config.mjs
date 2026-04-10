// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ma3ak.top',

  image: {
    domains: ['static.ma3ak.top'],
    remotePatterns: [{
      protocol: 'https',
      hostname: 'static.ma3ak.top',
    }],
  },

  output: 'server',

  adapter: cloudflare({
    imageService: {
      build: 'compile',
      runtime: 'cloudflare-binding'
    },
  }),

  integrations: [
    svelte(),
    sitemap(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
        // الحل الجذري لمنع تحذيرات الـ APIs المهجورة
        exclude: ['sharedStorage', 'attributionReporting'],
        resolveProperty: (url, property) => {
          if (property === 'sharedStorage' || property === 'attributionReporting') {
            return null;
          }
          return undefined;
        },
      },
    }),
  ],

  vite: {
    plugins: [
      tailwindcss()
    ],
    ssr: {
      external: []
    }
  }
});
