<script lang="ts">
  /**
   * ShareButton.svelte
   *
   * يشارك صورة العمل (.info.webp) فقط — بدون رابط أو دومين للموقع.
   *
   * طريقة العمل:
   * 1. تحميل الصورة كـ Blob
   * 2. استخدام navigator.share({ files }) على الهاتف (Mobile Web Share API Level 2)
   * 3. على الديسكتوب: فتح روابط المنصات مع رابط الصورة المباشر
   *
   * Props:
   *   infoImageUrl  — https://static.ma3ak.top/{type}/{prefix}/{id}/{id}.info.webp
   *   title         — عنوان العمل (للنص المصاحب)
   *   type          — 'movie' | 'tv'
   */

  let {
    infoImageUrl = '',
    title        = '',
    type         = 'movie' as 'movie' | 'tv',
  } = $props<{
    infoImageUrl: string;
    title: string;
    type?: 'movie' | 'tv';
  }>();

  type Platform = 'whatsapp' | 'facebook' | 'twitter' | 'telegram' | 'instagram' | 'download' | 'native';

  let open       = $state(false);
  let imgLoading = $state(false);
  let imgError   = $state('');
  let canNative  = $state(false);
  let canShare   = $state(false);  // supports file sharing

  const typeLabel  = type === 'movie' ? 'فيلم' : 'مسلسل';
  const shareText  = `شاهد ${typeLabel} "${title}" على معاك سيما 🎬`;
  const encodedImg = encodeURIComponent(infoImageUrl);

  $effect(() => {
    if (typeof navigator === 'undefined') return;
    canNative = !!navigator.share;
    // Check file share support (Mobile Web Share API Level 2)
    canShare  = canNative && !!navigator.canShare;
  });

  // ─── Fetch image as Blob ─────────────────────────────────────────────────
  async function fetchImageBlob(): Promise<File | null> {
    try {
      imgLoading = true;
      imgError   = '';
      const res  = await fetch(infoImageUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext  = blob.type.includes('webp') ? 'webp' : 'jpg';
      return new File([blob], `${title}.${ext}`, { type: blob.type });
    } catch (e) {
      imgError = 'تعذّر تحميل الصورة';
      console.error('ShareButton fetch error:', e);
      return null;
    } finally {
      imgLoading = false;
    }
  }

  // ─── Native share (mobile) — shares the image FILE ───────────────────────
  async function shareNative() {
    const file = await fetchImageBlob();
    if (!file) return;

    const shareData: ShareData = {
      title,
      text: shareText,
      files: [file],
    };

    // Check if file sharing is supported
    if (navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        open = false;
        return;
      } catch { /* user cancelled */ }
    }

    // Fallback: share without file (just text)
    try {
      await navigator.share({ title, text: shareText });
    } catch { /* cancelled */ }
  }

  // ─── Download image ───────────────────────────────────────────────────────
  async function downloadImage() {
    const file = await fetchImageBlob();
    if (!file) return;

    const url = URL.createObjectURL(file);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    open = false;
  }

  // ─── Platform click ───────────────────────────────────────────────────────
  async function handlePlatform(p: Platform) {
    switch (p) {
      case 'native':    await shareNative();  return;
      case 'download':  await downloadImage(); return;

      // المنصات التي تقبل رابط صورة مباشرة
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + infoImageUrl)}`,
          '_blank', 'noopener,width=600,height=500'
        );
        break;

      case 'twitter':
        // Twitter/X يدعم إرسال صورة عبر رابط مباشر في النص
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedImg}`,
          '_blank', 'noopener,width=600,height=500'
        );
        break;

      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodedImg}&text=${encodeURIComponent(shareText)}`,
          '_blank', 'noopener,width=600,height=500'
        );
        break;

      case 'facebook':
        // Facebook لا يسمح بمشاركة صور خارجية مباشرة من الإنترنت عبر الـ sharer
        // الحل: تحميل الصورة ثم المشاركة
        await downloadImage();
        window.open('https://www.facebook.com/', '_blank', 'noopener');
        break;

      case 'instagram':
        // Instagram لا يدعم web share → نحمّل الصورة ثم نفتح Instagram
        await downloadImage();
        // على الهاتف يمكن فتح التطبيق
        if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
          window.open('instagram://library', '_blank');
        }
        break;
    }
    open = false;
  }

  const platforms = [
    {
      id:    'native' as Platform,
      label: 'مشاركة الصورة مباشرة',
      sub:   'عبر تطبيقات الجهاز',
      icon:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`,
      color: '#ffffff',
      bg:    'rgba(255,255,255,.1)',
      mobileOnly: true,
    },
    {
      id:    'whatsapp' as Platform,
      label: 'واتساب',
      sub:   'مشاركة الصورة + نص',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
      color: '#25D366',
      bg:    'rgba(37,211,102,.1)',
      mobileOnly: false,
    },
    {
      id:    'telegram' as Platform,
      label: 'تيليغرام',
      sub:   'إرسال رابط الصورة',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
      color: '#26A5E4',
      bg:    'rgba(38,165,228,.1)',
      mobileOnly: false,
    },
    {
      id:    'twitter' as Platform,
      label: 'X (تويتر)',
      sub:   'تغريدة مع الصورة',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      color: '#e4e4e7',
      bg:    'rgba(255,255,255,.08)',
      mobileOnly: false,
    },
    {
      id:    'facebook' as Platform,
      label: 'فيسبوك',
      sub:   'تحميل ثم نشر',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
      color: '#1877F2',
      bg:    'rgba(24,119,242,.1)',
      mobileOnly: false,
    },
    {
      id:    'instagram' as Platform,
      label: 'إنستغرام',
      sub:   'تحميل ثم النشر في التطبيق',
      icon:  `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
      color: '#E1306C',
      bg:    'rgba(225,48,108,.1)',
      mobileOnly: false,
    },
    {
      id:    'download' as Platform,
      label: 'تحميل الصورة',
      sub:   'حفظ على جهازك',
      icon:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      color: '#a1a1aa',
      bg:    'rgba(161,161,170,.1)',
      mobileOnly: false,
    },
  ];

  // Filter: hide "مشاركة مباشرة" on desktop (only show on mobile)
  let isMobile = $state(false);
  $effect(() => {
    isMobile = typeof navigator !== 'undefined' &&
      /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
  });

  let visiblePlatforms = $derived(
    platforms.filter(p => !p.mobileOnly || isMobile)
  );
</script>

<div class="relative inline-block">
  <!-- Trigger -->
  <button
    onclick={() => { open = !open; imgError = ''; }}
    aria-label="مشاركة صورة العمل"
    aria-expanded={open}
    class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm
           transition-all duration-300 border bg-zinc-800/60 border-zinc-700 text-zinc-300
           hover:bg-zinc-700 hover:text-white hover:border-zinc-500 active:scale-95"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
    مشاركة الصورة
  </button>

  {#if open}
    <!-- Backdrop -->
    <button
      class="fixed inset-0 z-40 cursor-default bg-transparent"
      aria-hidden="true"
      onclick={() => open = false}
      tabindex="-1"
    ></button>

    <!-- Panel -->
    <div
      class="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-2xl border border-zinc-700/80
             bg-zinc-900/98 backdrop-blur-xl shadow-2xl shadow-black/70 overflow-hidden animate-panel"
      role="dialog"
      aria-label="خيارات مشاركة الصورة"
    >
      <!-- Image preview -->
      {#if infoImageUrl}
        <div class="relative w-full aspect-[16/9] overflow-hidden bg-zinc-800">
          <img
            src={infoImageUrl}
            alt={title}
            class="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent"></div>
          <div class="absolute bottom-0 right-0 left-0 p-3">
            <p class="text-white text-sm font-black line-clamp-1">{title}</p>
            <p class="text-zinc-400 text-xs mt-0.5">مشاركة الصورة بدون رابط الموقع</p>
          </div>
        </div>
      {/if}

      <!-- Error -->
      {#if imgError}
        <div class="px-4 py-2 bg-red-900/30 border-b border-red-800/50">
          <p class="text-red-400 text-xs font-bold">{imgError}</p>
        </div>
      {/if}

      <!-- Loading indicator -->
      {#if imgLoading}
        <div class="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <span class="w-3 h-3 border-2 border-zinc-500 border-t-amber-500 rounded-full animate-spin"></span>
          <span class="text-xs text-zinc-400 font-medium">جاري تحميل الصورة...</span>
        </div>
      {/if}

      <!-- Platform list -->
      <div class="p-2 space-y-0.5">
        {#each visiblePlatforms as p (p.id)}
          <button
            onclick={() => handlePlatform(p.id)}
            disabled={imgLoading}
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right
                   transition-all duration-150 hover:scale-[1.01] active:scale-[.99]
                   disabled:opacity-40 disabled:cursor-not-allowed"
            style={`color:${p.color}; background:${p.bg};`}
          >
            <span class="shrink-0">{@html p.icon}</span>
            <div class="flex-1 text-right">
              <div class="text-sm font-black">{p.label}</div>
              <div class="text-[10px] opacity-60 font-medium">{p.sub}</div>
            </div>
          </button>
        {/each}
      </div>

      <!-- Note -->
      <div class="px-4 py-3 border-t border-zinc-800/60">
        <p class="text-[10px] text-zinc-600 text-center leading-relaxed">
          يتم مشاركة صورة العمل فقط · بدون رابط الموقع
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes panel-in {
    from { opacity: 0; transform: translateY(6px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)  scale(1);    }
  }
  .animate-panel { animation: panel-in .15s cubic-bezier(.22,1,.36,1) both; }
</style>
