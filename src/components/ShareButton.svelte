<script lang="ts">
  /**
   * ShareButton.svelte
   * زر مشاركة الفيلم/المسلسل على مواقع التواصل الاجتماعي
   *
   * Props:
   *   title      — عنوان العمل
   *   url        — رابط الصفحة الكاملة (https://ma3ak.top/movie/slug)
   *   imageUrl   — رابط صورة .info.webp من static.mogcdn.com
   *   type       — 'movie' | 'tv'
   */

  let {
    title    = '',
    url      = '',
    imageUrl = '',
    type     = 'movie',
  } = $props<{
    title: string;
    url: string;
    imageUrl: string;
    type: 'movie' | 'tv';
  }>();

  let open    = $state(false);
  let copied  = $state(false);
  let nativeOk = $state(false);

  // Check native share support on mount
  $effect(() => {
    nativeOk = typeof navigator !== 'undefined' && !!navigator.share;
  });

  const typeLabel = type === 'movie' ? 'فيلم' : 'مسلسل';
  const shareText = `شاهد ${typeLabel} "${title}" على معاك سيما 🎬`;

  // Encode for URLs
  const encUrl  = () => encodeURIComponent(url);
  const encText = () => encodeURIComponent(shareText);
  const encImg  = () => encodeURIComponent(imageUrl);

  // Social platform links
  const platforms = [
    {
      id: 'whatsapp',
      label: 'واتساب',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
      href: () => `https://wa.me/?text=${encText()}%20${encUrl()}`,
      color: '#25D366',
      bg: 'rgba(37,211,102,.12)',
    },
    {
      id: 'facebook',
      label: 'فيسبوك',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
      href: () => `https://www.facebook.com/sharer/sharer.php?u=${encUrl()}`,
      color: '#1877F2',
      bg: 'rgba(24,119,242,.12)',
    },
    {
      id: 'twitter',
      label: 'X (تويتر)',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      href: () => `https://twitter.com/intent/tweet?text=${encText()}&url=${encUrl()}`,
      color: '#000',
      bg: 'rgba(0,0,0,.1)',
    },
    {
      id: 'telegram',
      label: 'تيليغرام',
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
      href: () => `https://t.me/share/url?url=${encUrl()}&text=${encText()}`,
      color: '#26A5E4',
      bg: 'rgba(38,165,228,.12)',
    },
    {
      id: 'copy',
      label: copied ? 'تم النسخ ✓' : 'نسخ الرابط',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
      href: null,
      color: '#a1a1aa',
      bg: 'rgba(161,161,170,.12)',
    },
  ];

  async function handleClick(platform: typeof platforms[0]) {
    if (platform.id === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
        setTimeout(() => { copied = false; }, 2000);
      } catch {
        // fallback
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        copied = true;
        setTimeout(() => { copied = false; }, 2000);
      }
      return;
    }
    window.open(platform.href!(), '_blank', 'noopener,width=600,height=500');
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: shareText, url });
    } catch { /* user cancelled */ }
  }
</script>

<!-- Share Button -->
<div class="relative">
  <!-- Trigger button -->
  <button
    onclick={() => open = !open}
    aria-label="مشاركة"
    aria-expanded={open}
    class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border
           bg-zinc-800/60 border-zinc-700 text-zinc-300
           hover:bg-zinc-700 hover:text-white hover:border-zinc-500
           active:scale-95"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
    مشاركة
  </button>

  <!-- Dropdown panel -->
  {#if open}
    <!-- Backdrop -->
    <button
      class="fixed inset-0 z-40 cursor-default"
      aria-hidden="true"
      onclick={() => open = false}
      tabindex="-1"
    ></button>

    <!-- Panel -->
    <div
      class="absolute left-0 bottom-full mb-2 z-50 w-64 rounded-2xl border border-zinc-700/80
             bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden
             animate-panel"
      role="dialog"
      aria-label="خيارات المشاركة"
    >
      <!-- Header with preview image -->
      {#if imageUrl}
        <div class="relative h-28 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            class="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
          <p class="absolute bottom-2 right-3 left-3 text-sm font-black text-white line-clamp-1">{title}</p>
        </div>
      {:else}
        <div class="px-4 pt-4 pb-2 border-b border-zinc-800">
          <p class="text-sm font-black text-white line-clamp-1">{title}</p>
          <p class="text-xs text-zinc-500 mt-0.5">مشاركة على</p>
        </div>
      {/if}

      <!-- Native share (mobile) -->
      {#if nativeOk}
        <button
          onclick={nativeShare}
          class="w-full flex items-center gap-3 px-4 py-3 text-right text-sm font-bold text-zinc-200
                 hover:bg-zinc-800 transition-colors border-b border-zinc-800/60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          مشاركة عبر التطبيقات
        </button>
      {/if}

      <!-- Platform buttons -->
      <div class="p-2 space-y-1">
        {#each platforms as p (p.id)}
          <button
            onclick={() => handleClick(p)}
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-sm font-bold
                   transition-all duration-200 hover:scale-[1.01] active:scale-95"
            style={`color: ${p.color}; background: ${p.id === 'copy' && copied ? 'rgba(34,197,94,.15)' : p.bg};`}
          >
            <span class="shrink-0">{@html p.icon}</span>
            <span class="flex-1">{p.id === 'copy' && copied ? 'تم النسخ ✓' : p.label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes panel-in {
    from { opacity: 0; transform: translateY(8px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-panel {
    animation: panel-in .18s cubic-bezier(.22,1,.36,1) both;
  }
</style>
