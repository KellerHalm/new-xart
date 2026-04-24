<script setup lang="ts">
import type { ReleaseDetail } from '~~/shared/types/anix'

const route = useRoute()
const releaseId = Number.parseInt(String(route.params.id), 10)

if (!Number.isFinite(releaseId)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Release not found',
  })
}

const {
  data: release,
  pending,
  error,
  refresh,
} = await useAsyncData(
  () => `release:${releaseId}`,
  () => $fetch<ReleaseDetail>(`/api/releases/${releaseId}`),
)

const watchPath = computed(() => `/watch/${releaseId}`)

const badges = computed(() =>
  [
    release.value?.status,
    release.value?.categoryName,
    release.value?.sourceLabel,
    release.value?.adult ? '18+' : formatAgeRating(release.value?.ageRating),
  ].filter(Boolean),
)

const metaFacts = computed(() =>
  [
    { label: 'Original title', value: release.value?.originalTitle },
    { label: 'Alternative title', value: release.value?.altTitle },
    { label: 'Country', value: release.value?.country },
    { label: 'Studio', value: release.value?.studio },
    { label: 'Author', value: release.value?.author },
    { label: 'Director', value: release.value?.director },
    { label: 'Release window', value: release.value?.releaseDate },
    { label: 'Aired on', value: formatUnixDate(release.value?.airedOnDate) },
    { label: 'Duration', value: formatDuration(release.value?.duration) },
    { label: 'Episodes', value: formatEpisodes(release.value) },
    { label: 'Age rating', value: formatAgeRating(release.value?.ageRating) },
  ].filter((item) => Boolean(item.value)),
)

const statFacts = computed(() =>
  [
    { label: 'Rating', value: formatCount(release.value?.rating ?? 0) },
    { label: 'Favorites', value: formatCount(release.value?.favoritesCount ?? 0) },
    { label: 'Watching', value: formatCount(release.value?.watchingCount ?? 0) },
    { label: 'Planned', value: formatCount(release.value?.planCount ?? 0) },
    { label: 'Completed', value: formatCount(release.value?.completedCount ?? 0) },
  ],
)

useSeoMeta({
  title: () => release.value?.title || 'Release',
  description: () => release.value?.description || 'Anime release detail page',
  ogTitle: () => release.value?.title || 'Release',
  ogDescription: () => release.value?.description || '',
  ogImage: () => release.value?.poster || '',
})

function formatAgeRating(value: number | null | undefined) {
  if (!value) {
    return null
  }

  const mapping: Record<number, string> = {
    1: '0+',
    2: '6+',
    3: '12+',
    4: '16+',
    5: '18+',
  }

  return mapping[value] || null
}

function formatDuration(value: number | null | undefined) {
  if (!value) {
    return null
  }

  return `${value} min`
}

function formatUnixDate(value: number | null | undefined) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long',
  }).format(new Date(value * 1000))
}

function formatCount(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatEpisodes(value: ReleaseDetail | null | undefined) {
  if (!value) {
    return null
  }

  if (value.episodesTotal) {
    return `${value.episodesReleased ?? 0}/${value.episodesTotal}`
  }

  if (value.episodesReleased) {
    return String(value.episodesReleased)
  }

  return null
}
</script>

<template>
  <div class="space-y-10 pt-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink class="ring-link" to="/">
        Back to catalog
      </NuxtLink>

      <button
        v-if="error"
        class="ring-link"
        type="button"
        @click="refresh()"
      >
        Retry
      </button>
    </div>

    <section
      v-if="pending"
      class="grid gap-6 lg:grid-cols-[0.44fr_0.56fr]"
    >
      <div class="stack-shell aspect-[3/4] animate-pulse bg-white/55" />
      <div class="stack-shell min-h-[34rem] animate-pulse bg-white/55" />
    </section>

    <section
      v-else-if="error || !release"
      class="stack-shell p-8"
    >
      <p class="tone-label">Load error</p>
      <h2 class="mt-4 font-display text-5xl leading-none text-ink">
        Release page is unavailable
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
        {{ error?.message || 'OpenAnix did not return release data for this item.' }}
      </p>
    </section>

    <template v-else>
      <section class="grid gap-6 lg:grid-cols-[0.44fr_0.56fr]">
        <div class="stack-shell overflow-hidden">
          <div class="relative aspect-[3/4] overflow-hidden bg-ink/5">
            <img
              :src="release.poster"
              :alt="release.title"
              class="h-full w-full object-cover"
            >

            <div class="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4">
              <span class="rounded-full bg-white/88 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
                {{ release.year || 'TBA' }}
              </span>
              <span
                class="rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white"
                :class="release.playable ? 'bg-accent' : 'bg-ink/80'"
              >
                {{ release.playable ? 'watch ready' : 'catalog only' }}
              </span>
            </div>
          </div>
        </div>

        <article class="stack-shell relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-accent-soft/10 via-transparent to-transparent lg:block" />

          <p class="tone-label">Release #{{ release.id }}</p>

          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="badge in badges"
              :key="badge"
              class="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              {{ badge }}
            </span>
          </div>

          <h1 class="mt-6 max-w-4xl font-display text-5xl leading-[0.9] text-ink sm:text-6xl lg:text-7xl">
            {{ release.title }}
          </h1>

          <p
            v-if="release.originalTitle"
            class="mt-4 text-base text-muted sm:text-lg"
          >
            {{ release.originalTitle }}
          </p>

          <p class="mt-6 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted sm:text-base">
            {{ release.description }}
          </p>

          <div class="mt-8 flex flex-wrap gap-2">
            <span
              v-for="genre in release.genres"
              :key="genre"
              class="rounded-full border border-ink/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              {{ genre }}
            </span>
          </div>

          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink
              class="ring-link"
              :to="watchPath"
            >
              Open Watch Page
            </NuxtLink>

            <NuxtLink
              class="ring-link"
              to="/"
            >
              Return To Feed
            </NuxtLink>
          </div>

          <ReleaseLibraryControls
            class="mt-8"
            :release-id="release.id"
            :initial-state="release.userState"
            authed-description="Mutation endpoints are live for the active session."
          />
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.54fr_0.46fr]">
        <div class="stack-shell p-6 sm:p-8">
          <SectionHeading
            label="Metadata"
            title="Release Facts"
            description="The page is built from normalized release detail data, so later features can reuse the same contract for watch and recommendation flows."
          />

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <article
              v-for="fact in metaFacts"
              :key="fact.label"
              class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {{ fact.label }}
              </p>
              <p class="mt-2 text-sm leading-6 text-ink sm:text-base">
                {{ fact.value }}
              </p>
            </article>
          </div>
        </div>

        <div class="stack-shell p-6 sm:p-8">
          <SectionHeading
            label="Signals"
            title="Audience Snapshot"
            description="A quick view of how the release performs inside the OpenAnix catalog."
          />

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <article
              v-for="fact in statFacts"
              :key="fact.label"
              class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {{ fact.label }}
              </p>
              <p class="mt-3 text-3xl font-semibold text-ink">
                {{ fact.value }}
              </p>
            </article>
          </div>

          <div class="mt-8 rounded-[1.75rem] border border-ink/10 bg-white/55 p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Detail score
            </p>
            <div class="mt-4 flex items-end justify-between gap-4">
              <p class="font-display text-6xl leading-none text-ink">
                {{ release.grade.toFixed(1) }}
              </p>
              <div class="text-right text-sm text-muted">
                <p>{{ release.rating }} catalog reactions</p>
                <p>{{ formatEpisodes(release) || 'Episode data pending' }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="release.related.length"
        class="space-y-6"
      >
        <SectionHeading
          label="Related"
          title="Connected Releases"
          description="Directly related titles from the same franchise or adjacent release chain."
        />

        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ReleaseRailCard
            v-for="item in release.related"
            :key="`related-${item.id}`"
            :release="item"
          />
        </div>
      </section>

      <section
        v-if="release.recommended.length"
        class="space-y-6"
      >
        <SectionHeading
          label="Recommended"
          title="What To Open Next"
          description="Recommendation data comes directly from the release detail payload and is already normalized into the same card contract."
        />

        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ReleaseRailCard
            v-for="item in release.recommended.slice(0, 6)"
            :key="`recommended-${item.id}`"
            :release="item"
          />
        </div>
      </section>
    </template>
  </div>
</template>
