<script setup lang="ts">
import type { EpisodeItem, PlayerPayload, ReleaseDetail } from '~~/shared/types/anix'

const route = useRoute()
const releaseId = Number.parseInt(String(route.params.id), 10)

if (!Number.isFinite(releaseId)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Release not found',
  })
}

interface WatchRouteState {
  dubberId: number | null
  sourceId: number | null
  episode: number | null
}

const routeState = computed<WatchRouteState>(() => ({
  dubberId: parsePositiveInt(route.query.dubberId),
  sourceId: parsePositiveInt(route.query.sourceId),
  episode: parsePositiveInt(route.query.episode),
}))

const playerKey = computed(
  () =>
    `watch:${releaseId}:${routeState.value.dubberId ?? 'auto'}:${routeState.value.sourceId ?? 'auto'}:${routeState.value.episode ?? 'auto'}`,
)

const {
  data: release,
  pending: releasePending,
  error: releaseError,
  refresh: refreshRelease,
} = await useAsyncData(
  () => `watch-release:${releaseId}`,
  () => $fetch<ReleaseDetail>(`/api/releases/${releaseId}`),
)

const {
  data: player,
  pending: playerPending,
  error: playerError,
  refresh: refreshPlayer,
} = await useAsyncData(
  () => playerKey.value,
  () =>
    $fetch<PlayerPayload>(`/api/releases/${releaseId}/player`, {
      query: {
        dubberId: routeState.value.dubberId || undefined,
        sourceId: routeState.value.sourceId || undefined,
        episodePosition: routeState.value.episode || undefined,
      },
    }),
  {
    watch: [playerKey],
  },
)

const activeDubber = computed(
  () =>
    player.value?.dubbers.find(
      (item) => item.id === player.value?.activeDubberId,
    ) || null,
)

const activeSource = computed(
  () =>
    player.value?.sources.find(
      (item) => item.id === player.value?.activeSourceId,
    ) || null,
)

const currentEpisode = computed<EpisodeItem | null>(
  () =>
    player.value?.episodes.find(
      (item) => item.position === player.value?.activeEpisodePosition,
    ) ||
    player.value?.episodes[0] ||
    null,
)

const hasPlayableStream = computed(
  () => Boolean(player.value?.dubbers.length && player.value?.episodes.length),
)

const streamFacts = computed(() =>
  [
    {
      label: 'Dubber',
      value: activeDubber.value?.name || 'Auto',
    },
    {
      label: 'Source',
      value: activeSource.value?.name || 'Pending',
    },
    {
      label: 'Episodes',
      value: `${player.value?.episodes.length || 0} ready`,
    },
    {
      label: 'Host',
      value: extractHostname(currentEpisode.value?.url) || 'Unknown',
    },
  ],
)

useSeoMeta({
  title: () => {
    if (!release.value) {
      return 'Watch'
    }

    if (!currentEpisode.value) {
      return `Watch ${release.value.title}`
    }

    return `${release.value.title} - Episode ${currentEpisode.value.position}`
  },
  description: () =>
    release.value
      ? `Watch ${release.value.title}, switch dubbers and episode sources, and move through the episode list from a single route.`
      : 'Watch anime release',
  ogTitle: () => release.value?.title || 'Watch',
  ogDescription: () =>
    currentEpisode.value
      ? `${currentEpisode.value.name} via ${activeSource.value?.name || 'source'}`
      : release.value?.description || '',
  ogImage: () => release.value?.poster || '',
})

if (import.meta.client) {
  watch(
    () => player.value,
    async (value) => {
      if (!value) {
        return
      }

      const nextQuery = buildWatchQuery({
        dubberId: value.activeDubberId,
        sourceId: value.activeSourceId,
        episode: value.activeEpisodePosition,
      })

      const currentQuery = buildWatchQuery(routeState.value)

      if (stringifyWatchQuery(nextQuery) === stringifyWatchQuery(currentQuery)) {
        return
      }

      await navigateTo(
        {
          path: route.path,
          query: nextQuery,
        },
        {
          replace: true,
        },
      )
    },
    {
      immediate: true,
    },
  )
}

async function syncWatchRoute(partial: Partial<WatchRouteState>) {
  const nextState: WatchRouteState = {
    dubberId:
      partial.dubberId !== undefined
        ? partial.dubberId
        : routeState.value.dubberId,
    sourceId:
      partial.sourceId !== undefined
        ? partial.sourceId
        : routeState.value.sourceId,
    episode:
      partial.episode !== undefined ? partial.episode : routeState.value.episode,
  }

  const nextQuery = buildWatchQuery(nextState)
  const currentQuery = buildWatchQuery(routeState.value)

  if (stringifyWatchQuery(nextQuery) === stringifyWatchQuery(currentQuery)) {
    return
  }

  await navigateTo(
    {
      path: route.path,
      query: nextQuery,
    },
    {
      replace: true,
    },
  )
}

async function selectDubber(dubberId: number) {
  await syncWatchRoute({
    dubberId,
    sourceId: null,
    episode: null,
  })
}

async function selectSource(sourceId: number) {
  await syncWatchRoute({
    dubberId: player.value?.activeDubberId || routeState.value.dubberId,
    sourceId,
    episode: null,
  })
}

async function selectEpisode(position: number) {
  await syncWatchRoute({
    dubberId: player.value?.activeDubberId || routeState.value.dubberId,
    sourceId: player.value?.activeSourceId || routeState.value.sourceId,
    episode: position,
  })
}

function formatEpisodes(value: ReleaseDetail | null | undefined) {
  if (!value) {
    return 'Unknown'
  }

  if (value.episodesTotal) {
    return `${value.episodesReleased ?? 0}/${value.episodesTotal}`
  }

  if (value.episodesReleased) {
    return String(value.episodesReleased)
  }

  return 'Unknown'
}

function formatViews(value: number | null | undefined) {
  if (!value) {
    return '0'
  }

  return new Intl.NumberFormat('ru-RU', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function parsePositiveInt(value: unknown) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function buildWatchQuery(state: WatchRouteState) {
  const query: Record<string, string> = {}

  if (state.dubberId) {
    query.dubberId = String(state.dubberId)
  }

  if (state.sourceId) {
    query.sourceId = String(state.sourceId)
  }

  if (state.episode) {
    query.episode = String(state.episode)
  }

  return query
}

function stringifyWatchQuery(query: Record<string, string>) {
  return JSON.stringify(query)
}

function extractHostname(value: string | null | undefined) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}
</script>

<template>
  <div class="space-y-8 pt-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink class="ring-link" :to="`/releases/${releaseId}`">
        Back to release
      </NuxtLink>

      <div class="flex flex-wrap gap-3">
        <button class="ring-link" type="button" @click="refreshPlayer()">
          Refresh player
        </button>
        <NuxtLink class="ring-link" to="/">
          Catalog
        </NuxtLink>
      </div>
    </div>

    <section
      v-if="releasePending && !release"
      class="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]"
    >
      <div class="stack-shell min-h-[18rem] animate-pulse bg-white/55" />
      <div class="stack-shell min-h-[18rem] animate-pulse bg-white/55" />
    </section>

    <section
      v-else-if="releaseError || !release"
      class="stack-shell p-8"
    >
      <p class="tone-label">Load error</p>
      <h1 class="mt-4 font-display text-5xl leading-none text-ink">
        Watch page is unavailable
      </h1>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
        {{ releaseError?.message || 'Release data is unavailable.' }}
      </p>
      <button class="ring-link mt-6" type="button" @click="refreshRelease()">
        Retry release
      </button>
    </section>

    <template v-else>
      <section class="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <article class="stack-shell relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-accent-soft/12 via-transparent to-transparent lg:block" />

          <p class="tone-label">Watch / embedded stream</p>

          <div class="mt-6 flex flex-wrap gap-2">
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              {{ release.status || 'release' }}
            </span>
            <span
              v-if="release.categoryName"
              class="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              {{ release.categoryName }}
            </span>
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              {{ formatEpisodes(release) }} episodes
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

          <p class="mt-6 max-w-3xl text-sm leading-7 text-muted sm:text-base">
            {{ release.description }}
          </p>

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <article
              v-for="fact in streamFacts"
              :key="fact.label"
              class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {{ fact.label }}
              </p>
              <p class="mt-2 text-base font-semibold text-ink">
                {{ fact.value }}
              </p>
            </article>
          </div>
        </article>

        <aside class="stack-shell p-5 sm:p-6">
          <img
            :src="release.poster"
            :alt="release.title"
            class="aspect-[3/4] w-full rounded-[2rem] object-cover"
          >

          <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Active episode
              </p>
              <p class="mt-3 text-3xl font-semibold text-ink">
                {{ currentEpisode?.position || 'N/A' }}
              </p>
              <p class="mt-2 text-sm leading-6 text-muted">
                {{ currentEpisode?.name || 'OpenAnix has not returned episode items yet.' }}
              </p>
            </article>

            <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Audience
              </p>
              <p class="mt-3 text-3xl font-semibold text-ink">
                {{ formatViews(release.rating) }}
              </p>
              <p class="mt-2 text-sm leading-6 text-muted">
                catalog reactions
              </p>
            </article>

            <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Voiceover team
              </p>
              <p class="mt-2 text-lg font-semibold text-ink">
                {{ activeDubber?.workers || activeDubber?.name || 'Pending' }}
              </p>
              <p class="mt-2 text-sm leading-6 text-muted">
                {{ activeDubber?.isSub ? 'Subtitles / text track' : 'Dubbed audio track' }}
              </p>
            </article>
          </div>
        </aside>
      </section>

      <section
        v-if="playerPending && !player"
        class="stack-shell min-h-[26rem] animate-pulse bg-white/55"
      />

      <section
        v-else-if="playerError"
        class="stack-shell p-8"
      >
        <p class="tone-label">Player error</p>
        <h2 class="mt-4 font-display text-5xl leading-none text-ink">
          Stream data is unavailable
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          {{ playerError.message }}
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <button class="ring-link" type="button" @click="refreshPlayer()">
            Retry player
          </button>
          <button class="ring-link" type="button" @click="refreshRelease()">
            Refresh release
          </button>
        </div>
      </section>

      <section
        v-else-if="!hasPlayableStream || !player"
        class="stack-shell p-8"
      >
        <p class="tone-label">No streams</p>
        <h2 class="mt-4 font-display text-5xl leading-none text-ink">
          OpenAnix returned no playable episodes
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          This release exists in the catalog, but the episode chain currently has no
          dubbers or episode entries. The route stays valid so the user can return
          later without losing context.
        </p>
        <div class="mt-6 flex flex-wrap gap-3 text-sm text-muted">
          <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
            {{ player?.dubbers.length || 0 }} dubbers
          </span>
          <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
            {{ player?.sources.length || 0 }} sources
          </span>
          <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
            {{ player?.episodes.length || 0 }} episodes
          </span>
        </div>
      </section>

      <template v-else>
        <section class="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
          <div class="stack-shell overflow-hidden">
            <div class="aspect-video bg-ink">
              <iframe
                v-if="currentEpisode?.iframe"
                :src="currentEpisode.url"
                :title="`${release.title} - ${currentEpisode.name}`"
                class="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"
              />

              <div
                v-else
                class="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white"
              >
                <p class="text-sm uppercase tracking-[0.22em] text-white/65">
                  External player required
                </p>
                <h2 class="max-w-xl font-display text-5xl leading-none">
                  {{ currentEpisode?.name || 'Episode unavailable' }}
                </h2>
                <p class="max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  The selected episode URL is not marked as embeddable. Open it in a
                  separate tab and keep the current route for episode navigation.
                </p>
                <a
                  v-if="currentEpisode?.url"
                  class="ring-link border-white/20 text-white hover:border-white hover:bg-white hover:text-ink"
                  :href="currentEpisode.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open external player
                </a>
              </div>
            </div>

            <div class="p-6 sm:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="tone-label">Episode {{ currentEpisode?.position || 'N/A' }}</p>
                  <h2 class="mt-4 font-display text-4xl leading-none text-ink sm:text-5xl">
                    {{ currentEpisode?.name || 'Episode unavailable' }}
                  </h2>
                </div>

                <a
                  v-if="currentEpisode?.url"
                  class="ring-link"
                  :href="currentEpisode.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source
                </a>
              </div>

              <div class="mt-6 flex flex-wrap gap-3 text-sm text-muted">
                <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
                  {{ activeDubber?.name || 'Auto dubber' }}
                </span>
                <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
                  {{ activeSource?.name || 'Source pending' }}
                </span>
                <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
                  {{ currentEpisode?.iframe ? 'Iframe player' : 'External URL' }}
                </span>
                <span
                  v-if="playerPending"
                  class="rounded-full border border-accent/20 bg-accent/10 px-3 py-2 text-accent"
                >
                  Switching stream...
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="stack-shell p-6 sm:p-8">
              <SectionHeading
                label="Dubbers"
                title="Voice / Subs"
                description="The first switch chooses the translation or subtitle track, based on `/episode/:id`."
              />

              <div class="mt-8 flex flex-wrap gap-3">
                <button
                  v-for="item in player.dubbers"
                  :key="item.id"
                  type="button"
                  class="min-w-[13rem] rounded-[1.5rem] border p-4 text-left transition duration-200"
                  :class="
                    player.activeDubberId === item.id
                      ? 'border-accent bg-accent text-white shadow-lift'
                      : 'border-ink/10 bg-white/60 text-ink hover:border-ink/20 hover:bg-white/80'
                  "
                  @click="selectDubber(item.id)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold">{{ item.name }}</p>
                      <p
                        class="mt-1 text-xs uppercase tracking-[0.18em]"
                        :class="
                          player.activeDubberId === item.id ? 'text-white/70' : 'text-muted'
                        "
                      >
                        {{ item.isSub ? 'Subtitles' : 'Dubbed audio' }}
                      </p>
                    </div>
                    <img
                      v-if="item.icon"
                      :src="item.icon"
                      :alt="item.name"
                      class="h-10 w-10 rounded-full object-cover"
                    >
                  </div>

                  <div
                    class="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                    :class="player.activeDubberId === item.id ? 'text-white/80' : 'text-muted'"
                  >
                    <span>{{ item.episodesCount }} eps</span>
                    <span>{{ formatViews(item.viewCount) }} views</span>
                    <span v-if="item.pinned">Pinned</span>
                  </div>
                </button>
              </div>
            </div>

            <div class="stack-shell p-6 sm:p-8">
              <SectionHeading
                label="Sources"
                title="Stream Targets"
                description="The second switch comes from `/episode/:id/:episodeDubberId` and selects the concrete playback source."
              />

              <div class="mt-8 flex flex-wrap gap-3">
                <button
                  v-for="item in player.sources"
                  :key="item.id"
                  type="button"
                  class="rounded-[1.5rem] border px-4 py-4 text-left transition duration-200"
                  :class="
                    player.activeSourceId === item.id
                      ? 'border-accent bg-accent text-white shadow-lift'
                      : 'border-ink/10 bg-white/60 text-ink hover:border-ink/20 hover:bg-white/80'
                  "
                  @click="selectSource(item.id)"
                >
                  <p class="text-sm font-semibold">{{ item.name }}</p>
                  <p
                    class="mt-2 text-xs uppercase tracking-[0.18em]"
                    :class="player.activeSourceId === item.id ? 'text-white/70' : 'text-muted'"
                  >
                    {{ item.episodesCount }} episodes
                  </p>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="stack-shell p-6 sm:p-8">
          <SectionHeading
            label="Episodes"
            title="Episode List"
            description="This list is built from `/episode/:id/:episodeDubberId/:sourceId`. Clicking an item rewrites the route query and refetches the selected stream."
          >
            <div class="flex flex-wrap gap-2 text-sm text-muted">
              <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
                {{ player.episodes.length }} items
              </span>
              <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
                Source #{{ player.activeSourceId }}
              </span>
            </div>
          </SectionHeading>

          <div class="mt-8 grid max-h-[40rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <button
              v-for="episode in player.episodes"
              :key="episode.id"
              type="button"
              class="rounded-[1.5rem] border p-4 text-left transition duration-200"
              :class="
                player.activeEpisodePosition === episode.position
                  ? 'border-accent bg-accent text-white shadow-lift'
                  : 'border-ink/10 bg-white/60 text-ink hover:border-ink/20 hover:bg-white/80'
              "
              @click="selectEpisode(episode.position)"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.22em]"
                    :class="
                      player.activeEpisodePosition === episode.position
                        ? 'text-white/75'
                        : 'text-muted'
                    "
                  >
                    Episode {{ episode.position }}
                  </p>
                  <h3 class="mt-2 text-base font-semibold leading-tight">
                    {{ episode.name }}
                  </h3>
                </div>

                <span
                  class="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  :class="
                    player.activeEpisodePosition === episode.position
                      ? 'border-white/20 text-white/80'
                      : 'border-ink/10 text-muted'
                  "
                >
                  {{ episode.iframe ? 'iframe' : 'link' }}
                </span>
              </div>

              <div
                class="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
                :class="
                  player.activeEpisodePosition === episode.position
                    ? 'text-white/80'
                    : 'text-muted'
                "
              >
                <span v-if="episode.filler">Filler</span>
                <span v-if="episode.watched">Watched</span>
                <span>Source {{ episode.sourceId }}</span>
              </div>
            </button>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>
