<script setup lang="ts">
import {
  CATALOG_PRESETS,
  CATALOG_SORTS,
  DEFAULT_CATALOG_PRESET,
  DEFAULT_CATALOG_SORT,
  getCatalogPresetMeta,
  parseCatalogPage,
  parseCatalogPreset,
  parseCatalogSort,
} from '~~/shared/constants/catalog'
import type {
  CatalogFeedPayload,
  HomePagePayload,
  SearchFeedPayload,
} from '~~/shared/types/anix'

useSeoMeta({
  title: 'OpenXart',
  description:
    'Browse anime releases, search the OpenAnix catalog, open release pages and continue into the watch flow.',
})

const route = useRoute()

const searchDraft = ref(typeof route.query.q === 'string' ? route.query.q : '')

const catalogState = computed(() => {
  const query = typeof route.query.q === 'string' ? route.query.q.trim() : ''

  return {
    query,
    preset: parseCatalogPreset(route.query.preset),
    sort: parseCatalogSort(route.query.sort),
    page: parseCatalogPage(route.query.page),
  }
})

watch(
  () => catalogState.value.query,
  (value) => {
    searchDraft.value = value
  },
)

const collectionKey = computed(
  () =>
    `catalog:${catalogState.value.query}:${catalogState.value.preset}:${catalogState.value.sort}:${catalogState.value.page}`,
)

const {
  data: homeData,
  pending: homePending,
  error: homeError,
  refresh: refreshHome,
} = await useAsyncData('home-page', () => $fetch<HomePagePayload>('/api/home'))

const {
  data: collectionData,
  pending: collectionPending,
  error: collectionError,
  refresh: refreshCollection,
} = await useAsyncData(
  () => collectionKey.value,
  () =>
    catalogState.value.query
      ? $fetch<SearchFeedPayload>('/api/search', {
          query: {
            q: catalogState.value.query,
            page: catalogState.value.page,
          },
        })
      : $fetch<CatalogFeedPayload>('/api/catalog', {
          query: {
            preset: catalogState.value.preset,
            sort: catalogState.value.sort,
            page: catalogState.value.page,
          },
        }),
  {
    watch: [collectionKey],
  },
)

const isSearching = computed(() => Boolean(catalogState.value.query))
const activePresetMeta = computed(() =>
  getCatalogPresetMeta(catalogState.value.preset),
)

const collectionItems = computed(() => collectionData.value?.items || [])
const collectionTotal = computed(() => collectionData.value?.total || 0)
const canGoPrev = computed(() => catalogState.value.page > 0)
const canGoNext = computed(
  () => catalogState.value.page < (collectionData.value?.pageCount || 0),
)

const collectionTitle = computed(() => {
  if (isSearching.value) {
    return `Search: ${catalogState.value.query}`
  }

  return (
    (collectionData.value as CatalogFeedPayload | undefined)?.title ||
    activePresetMeta.value.title
  )
})

const collectionDescription = computed(() => {
  if (isSearching.value) {
    return 'Exact-match and fuzzy release search through the OpenAnix v2 search endpoint.'
  }

  return (
    (collectionData.value as CatalogFeedPayload | undefined)?.description ||
    activePresetMeta.value.description
  )
})

async function syncQuery(
  partial: Partial<{
    q: string | null
    preset: string | null
    sort: number | null
    page: number | null
  }>,
) {
  const nextQuery = {
    q: partial.q !== undefined ? partial.q : catalogState.value.query || null,
    preset:
      partial.preset !== undefined
        ? partial.preset
        : catalogState.value.preset,
    sort: partial.sort !== undefined ? partial.sort : catalogState.value.sort,
    page: partial.page !== undefined ? partial.page : catalogState.value.page,
  }

  const cleanedQuery: Record<string, string> = {}

  if (nextQuery.q && nextQuery.q.trim()) {
    cleanedQuery.q = nextQuery.q.trim()
  }

  if (
    nextQuery.preset &&
    nextQuery.preset !== DEFAULT_CATALOG_PRESET &&
    !cleanedQuery.q
  ) {
    cleanedQuery.preset = nextQuery.preset
  }

  if (
    nextQuery.sort !== null &&
    nextQuery.sort !== DEFAULT_CATALOG_SORT &&
    !cleanedQuery.q
  ) {
    cleanedQuery.sort = String(nextQuery.sort)
  }

  if (nextQuery.page !== null && nextQuery.page > 0) {
    cleanedQuery.page = String(nextQuery.page)
  }

  await navigateTo(
    {
      path: route.path,
      query: cleanedQuery,
    },
    {
      replace: true,
    },
  )
}

async function submitSearch() {
  await syncQuery({
    q: searchDraft.value || null,
    page: 0,
  })
}

async function clearSearch() {
  searchDraft.value = ''
  await syncQuery({
    q: null,
    page: 0,
  })
}

async function setPreset(preset: string) {
  await syncQuery({
    q: null,
    preset,
    page: 0,
  })
}

async function setSort(sort: number) {
  await syncQuery({
    sort,
    page: 0,
  })
}

async function goToPage(page: number) {
  await syncQuery({ page })
}
</script>

<template>
  <div class="space-y-10 pt-8">
    <section class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <article class="stack-shell relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-accent-soft/10 via-transparent to-transparent lg:block" />

        <p class="tone-label">OpenAnix | discover/interesting</p>

        <template v-if="homeData?.spotlight">
          <h2 class="mt-6 max-w-3xl font-display text-5xl leading-[0.9] text-ink sm:text-6xl lg:text-7xl">
            {{ homeData.spotlight.title }}
          </h2>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            {{ homeData.spotlight.description }}
          </p>
        </template>

        <template v-else>
          <h2 class="mt-6 max-w-3xl font-display text-5xl leading-[0.9] text-ink sm:text-6xl lg:text-7xl">
            Browse the catalog, pivot by feed, then drill into the watch flow.
          </h2>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Search, filter, open release pages and jump straight into the player
            route without leaving the same Nuxt application shell.
          </p>
        </template>

        <form class="mt-8 space-y-4" @submit.prevent="submitSearch">
          <label
            class="flex flex-col gap-3 rounded-[1.75rem] border border-ink/10 bg-white/75 p-4 shadow-sm"
          >
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Search releases
            </span>
            <div class="flex flex-col gap-3 sm:flex-row">
              <input
                v-model="searchDraft"
                type="text"
                placeholder="Naruto, Frieren, Monogatari, films..."
                class="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-5 py-3 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
              >
              <div class="flex gap-3">
                <button class="ring-link" type="submit">
                  Search
                </button>
                <button
                  v-if="isSearching"
                  class="ring-link"
                  type="button"
                  @click="clearSearch()"
                >
                  Reset
                </button>
              </div>
            </div>
          </label>
        </form>

        <div class="mt-6 flex flex-wrap gap-3">
          <button
            v-for="preset in CATALOG_PRESETS"
            :key="preset.value"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-medium transition duration-200"
            :class="
              !isSearching && catalogState.preset === preset.value
                ? 'border-accent bg-accent text-white'
                : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white'
            "
            @click="setPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <button class="ring-link" type="button" @click="refreshHome()">
            Refresh spotlight
          </button>
          <a class="ring-link" href="#catalog">
            Open catalog
          </a>
        </div>
      </article>

      <aside class="grid gap-4">
        <div class="stack-shell p-5">
          <p class="tone-label">Current stage</p>
          <h3 class="mt-4 text-2xl font-semibold text-ink">Release + watch flow</h3>
          <p class="mt-3 text-sm leading-6 text-muted">
            The app now covers the full browse path: catalog search, detail page,
            related titles and query-driven episode playback.
          </p>
        </div>

        <div class="stack-shell p-5">
          <p class="tone-label">Active mode</p>
          <h3 class="mt-4 text-2xl font-semibold text-ink">
            {{ isSearching ? 'Search results' : activePresetMeta.label }}
          </h3>
          <p class="mt-3 text-sm leading-6 text-muted">
            {{ collectionDescription }}
          </p>
          <div class="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
              {{ collectionTotal }} items
            </span>
            <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
              Page {{ catalogState.page + 1 }}
            </span>
          </div>
        </div>

        <div v-if="homeError" class="stack-shell p-5">
          <p class="tone-label">Spotlight issue</p>
          <p class="mt-4 text-sm leading-6 text-muted">
            {{ homeError.message }}
          </p>
        </div>

        <div v-else-if="homePending" class="stack-shell animate-pulse p-5">
          <div class="h-4 w-24 rounded-full bg-ink/10" />
          <div class="mt-4 h-8 w-40 rounded-full bg-ink/10" />
          <div class="mt-3 h-20 rounded-[1.5rem] bg-ink/10" />
        </div>

        <div
          v-else-if="homeData?.picks?.length"
          class="stack-shell p-5"
        >
          <p class="tone-label">Editorial picks</p>
          <div class="mt-4 space-y-4">
            <article
              v-for="pick in homeData.picks"
              :key="pick.id"
              class="rounded-3xl border border-ink/10 bg-white/60 p-4"
            >
              <p class="text-xs uppercase tracking-[0.18em] text-muted">
                Release #{{ pick.releaseId || 'N/A' }}
              </p>
              <h3 class="mt-2 text-lg font-semibold text-ink">{{ pick.title }}</h3>
              <p class="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                {{ pick.description }}
              </p>
            </article>
          </div>
        </div>
      </aside>
    </section>

    <section v-if="homeData?.latest?.length" class="space-y-6">
      <SectionHeading
        label="Pulse"
        title="Fast Picks"
        description="A quick strip of titles from the latest feed. This stays lightweight while the main catalog below can switch modes."
      />

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="release in homeData.latest.slice(0, 4)"
          :key="`pulse-${release.id}`"
          class="stack-shell flex gap-4 p-4"
        >
          <img
            :src="release.poster"
            :alt="release.title"
            class="h-28 w-20 rounded-2xl object-cover"
            loading="lazy"
          >

          <div class="min-w-0">
            <p class="text-xs uppercase tracking-[0.18em] text-muted">
              {{ release.status || 'release' }}
            </p>
            <h3 class="mt-2 line-clamp-2 text-lg font-semibold text-ink">
              {{ release.title }}
            </h3>
            <p class="mt-2 line-clamp-2 text-sm leading-6 text-muted">
              {{ release.description }}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section id="catalog" class="space-y-6">
      <SectionHeading
        label="Catalog"
        :title="collectionTitle"
        :description="collectionDescription"
      >
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {{ collectionTotal }} results
          </span>
          <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">
            page {{ catalogState.page + 1 }}
          </span>
        </div>
      </SectionHeading>

      <div class="stack-shell space-y-5 p-5 sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Feed presets
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in CATALOG_PRESETS"
                :key="`catalog-${preset.value}`"
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-medium transition duration-200"
                :class="
                  !isSearching && catalogState.preset === preset.value
                    ? 'border-accent bg-accent text-white'
                    : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white'
                "
                @click="setPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Sort
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="sort in CATALOG_SORTS"
                :key="`sort-${sort.value}`"
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="isSearching"
                :class="
                  !isSearching && catalogState.sort === sort.value
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white'
                "
                @click="setSort(sort.value)"
              >
                {{ sort.label }}
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="isSearching"
          class="rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-4 text-sm leading-6 text-muted"
        >
          Search mode ignores catalog sort and preset controls until the query is
          cleared. This keeps the URL and the active data source unambiguous.
        </div>

        <div
          v-if="collectionPending"
          class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div
            v-for="index in 8"
            :key="index"
            class="stack-shell h-[29rem] animate-pulse bg-white/55"
          />
        </div>

        <div
          v-else-if="collectionError"
          class="rounded-[1.75rem] border border-rose-300/40 bg-rose-50/60 p-6"
        >
          <p class="tone-label">Load error</p>
          <h3 class="mt-4 text-2xl font-semibold text-ink">
            Failed to load the current catalog slice
          </h3>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-muted">
            {{ collectionError.message }}
          </p>
          <button class="ring-link mt-6" type="button" @click="refreshCollection()">
            Retry
          </button>
        </div>

        <div
          v-else-if="!collectionItems.length"
          class="rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-8"
        >
          <p class="tone-label">Empty state</p>
          <h3 class="mt-4 text-2xl font-semibold text-ink">
            Nothing matched the current query
          </h3>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Clear the search string or switch back to one of the catalog presets.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <button class="ring-link" type="button" @click="clearSearch()">
              Clear search
            </button>
            <button class="ring-link" type="button" @click="setPreset('latest')">
              Latest feed
            </button>
          </div>
        </div>

        <div
          v-else
          class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <AnimeCard
            v-for="release in collectionItems"
            :key="release.id"
            :release="release"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
          <p class="text-sm text-muted">
            {{ isSearching ? 'Search query' : 'Catalog preset' }}:
            <span class="font-semibold text-ink">
              {{ isSearching ? catalogState.query : activePresetMeta.label }}
            </span>
          </p>

          <div class="flex gap-3">
            <button
              class="ring-link disabled:pointer-events-none disabled:opacity-40"
              type="button"
              :disabled="!canGoPrev"
              @click="goToPage(catalogState.page - 1)"
            >
              Prev
            </button>
            <button
              class="ring-link disabled:pointer-events-none disabled:opacity-40"
              type="button"
              :disabled="!canGoNext"
              @click="goToPage(catalogState.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
