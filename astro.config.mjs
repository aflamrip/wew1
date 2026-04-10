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
    // نوصي باستخدام remotePatterns للأمان والدقة مستقبلاً
    remotePatterns: [{
      protocol: 'https',
      hostname: 'static.ma3ak.top',
    }],
  },

  output: 'server',

  adapter: cloudflare({
    // إعداد ذكي: يستخدم الـ Binding في وقت التشغيل والمعالجة العادية في وقت البناء
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
    // إضافة الخصائص المسببة للمشاكل إلى قائمة التجاهل
        exclude: ['sharedStorage', 'attributionReporting'], 
        resolveProperty: (url, property) => {
          if (property === 'sharedStorage' || property === 'attributionReporting') {
            return null;
          }
          return undefined;السماح لباقي الخصائص بالعمل بشكل طبيعي
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
