<script>
  let { actorName, contentType = 'both', cdnBase } = $props();

  // Derived flags
  const showBoth   = contentType === 'both' || !['movie','movies','tv','series'].includes(contentType);
  const isMovePage = contentType === 'movie' || contentType === 'movies';

  let allItems    = $state([]);
  let loading     = $state(true);
  let error       = $state('');

  // Split items by type for display when showing both
  let movieItems  = $derived(allItems.filter(i => i.type === 'movie'));
  let tvItems     = $derived(allItems.filter(i => i.type === 'tv'));

  $effect(() => {
    if (!actorName) return;

    let cancelled = false;

    (async () => {
      loading = true;
      allItems = [];
      error = '';

      try {
        if (showBoth) {
          // Fetch movies and TV in parallel
          const [moviesRes, tvRes] = await Promise.all([
            fetch(`/api/cast/movie?name=${encodeURIComponent(actorName)}`),
            fetch(`/api/cast/tv?name=${encodeURIComponent(actorName)}`),
          ]);

          if (!moviesRes.ok && !tvRes.ok) throw new Error('API error');

          const [moviesData, tvData] = await Promise.all([
            moviesRes.ok ? moviesRes.json() : Promise.resolve([]),
            tvRes.ok    ? tvRes.json()    : Promise.resolve([]),
          ]);

          if (!cancelled) {
            allItems = [...moviesData, ...tvData];
          }
        } else {
          // Single type fetch
          const routeType = isMovePage ? 'movie' : 'tv';
          const res = await fetch(`/api/cast/${routeType}?name=${encodeURIComponent(actorName)}`);
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          if (!cancelled) allItems = data;
        }
      } catch (e) {
        if (!cancelled) {
          error = 'حدث خطأ أثناء البحث، يرجى المحاولة لاحقاً.';
          console.error('Cast search error:', e);
        }
      } finally {
        if (!cancelled) loading = false;
      }
    })();

    return () => { cancelled = true; };
  });

  function getPosterUrl(item) {
    const pluralType = item.type === 'movie' ? 'movies' : 'tv';
    const prefix = item.id.toString().substring(0, 2);
    return `${cdnBase}/${pluralType}/${prefix}/${item.id}/${item.id}.webp`;
  }

  function getItemUrl(item) {
    return `/${item.type}/${item.slug}`;
  }
</script>

<div class="space-y-10">
  <!-- Loading -->
  {#if loading}
    <div class="bg-zinc-900/60 rounded-2xl p-6 border border-zinc-800 space-y-4">
      <div class="flex items-center gap-3 text-sm font-bold text-zinc-400">
        <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
        جاري البحث عن أعمال {actorName} في الأفلام والمسلسلات...
      </div>
      <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div class="bg-gradient-to-l from-amber-500 to-orange-500 h-full rounded-full animate-pulse w-2/3"></div>
      </div>
    </div>
  {/if}

  <!-- Error -->
  {#if error}
    <div class="text-center py-16 bg-red-950/20 rounded-3xl border border-red-900/50">
      <p class="text-red-400 font-bold">{error}</p>
    </div>
  {/if}

  <!-- Results: Both movies and TV -->
  {#if !loading && !error && showBoth}
    <!-- Movies Section -->
    {#if movieItems.length > 0}
      <div class="space-y-4">
        <div class="flex items-center gap-3 pb-2 border-b border-zinc-800">
          <span class="w-1.5 h-6 bg-primary rounded-full"></span>
          <h2 class="text-xl font-black text-white">
            أفلام {actorName}
            <span class="text-sm text-zinc-500 font-medium mr-2">({movieItems.length})</span>
          </h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {#each movieItems as item (item.id + '-movie')}
            <a href={getItemUrl(item)} class="group block animate-fade-in">
              <div class="aspect-[2/3] rounded-2xl overflow-hidden relative shadow-2xl border border-zinc-800/50 group-hover:border-primary/50 transition-all duration-500">
                <img
                  src={getPosterUrl(item)}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/20 to-transparent opacity-60"></div>
                <div class="absolute bottom-0 p-4 w-full translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  <div class="flex items-center justify-between">
                    <span class="bg-primary/90 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg">
                      {item.year}
                    </span>
                    <span class="text-[10px] font-black text-white opacity-80">فيلم</span>
                  </div>
                </div>
              </div>
              <h3 class="mt-3 text-sm font-bold text-zinc-300 group-hover:text-primary truncate transition-colors">{item.title}</h3>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- TV Section -->
    {#if tvItems.length > 0}
      <div class="space-y-4">
        <div class="flex items-center gap-3 pb-2 border-b border-zinc-800">
          <span class="w-1.5 h-6 bg-amber-500 rounded-full"></span>
          <h2 class="text-xl font-black text-white">
            مسلسلات {actorName}
            <span class="text-sm text-zinc-500 font-medium mr-2">({tvItems.length})</span>
          </h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {#each tvItems as item (item.id + '-tv')}
            <a href={getItemUrl(item)} class="group block animate-fade-in">
              <div class="aspect-[2/3] rounded-2xl overflow-hidden relative shadow-2xl border border-zinc-800/50 group-hover:border-amber-500/50 transition-all duration-500">
                <img
                  src={getPosterUrl(item)}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/20 to-transparent opacity-60"></div>
                <div class="absolute bottom-0 p-4 w-full translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  <div class="flex items-center justify-between">
                    <span class="bg-amber-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg">
                      {item.year}
                    </span>
                    <span class="text-[10px] font-black text-white opacity-80">مسلسل</span>
                  </div>
                </div>
              </div>
              <h3 class="mt-3 text-sm font-bold text-zinc-300 group-hover:text-amber-400 truncate transition-colors">{item.title}</h3>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Empty State (both) -->
    {#if movieItems.length === 0 && tvItems.length === 0}
      <div class="text-center py-32 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
        <div class="text-6xl mb-6">🎭</div>
        <h2 class="text-2xl font-black text-zinc-400">عذراً، لم نتمكن من العثور على أعمال لـ {actorName}</h2>
        <p class="mt-2 text-zinc-500 font-medium">قد لا تتوفر البيانات التفصيلية حالياً.</p>
      </div>
    {/if}

  <!-- Results: Single type -->
  {:else if !loading && !error && !showBoth}
    {@const displayType  = isMovePage ? 'أفلام' : 'مسلسلات'}
    {@const routeType    = isMovePage ? 'movie' : 'tv'}
    {@const accentClass  = isMovePage ? 'border-primary/50' : 'border-amber-500/50'}
    {@const titleHover   = isMovePage ? 'group-hover:text-primary' : 'group-hover:text-amber-400'}
    {@const badgeBg      = isMovePage ? 'bg-primary/90' : 'bg-amber-500/90'}

    {#if allItems.length > 0}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {#each allItems as item (item.id)}
          <a href={getItemUrl(item)} class="group block animate-fade-in">
            <div class="aspect-[2/3] rounded-2xl overflow-hidden relative shadow-2xl border border-zinc-800/50 {accentClass} transition-all duration-500">
              <img
                src={getPosterUrl(item)}
                alt={item.title}
                loading="lazy"
                decoding="async"
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/20 to-transparent opacity-60"></div>
              <div class="absolute bottom-0 p-4 w-full translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                <div class="flex items-center justify-between">
                  <span class="{badgeBg} text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg">
                    {item.year}
                  </span>
                  <span class="text-[10px] font-black text-white opacity-80">
                    {isMovePage ? 'فيلم' : 'مسلسل'}
                  </span>
                </div>
              </div>
            </div>
            <h3 class="mt-3 text-sm font-bold text-zinc-300 {titleHover} truncate transition-colors">{item.title}</h3>
          </a>
        {/each}
      </div>
    {:else}
      <div class="text-center py-32 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
        <div class="text-6xl mb-6">🎭</div>
        <h2 class="text-2xl font-black text-zinc-400">عذراً، لم نتمكن من العثور على {displayType} لـ {actorName}</h2>
        <p class="mt-2 text-zinc-500 font-medium">قد لا تتوفر البيانات التفصيلية حالياً.</p>
        <div class="mt-8">
          <a href={`/${routeType}`} class="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-2xl font-black transition-all">تصفح {displayType}</a>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Final Count -->
  {#if !loading && allItems.length > 0}
    <div class="text-center py-4">
      <span class="bg-zinc-900 text-zinc-400 px-6 py-2 rounded-full text-sm font-bold border border-zinc-800">
        عُثر على {allItems.length} عمل لـ {actorName}
        {#if showBoth && movieItems.length > 0 && tvItems.length > 0}
          ({movieItems.length} فيلم · {tvItems.length} مسلسل)
        {/if}
      </span>
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out both;
  }
</style>
