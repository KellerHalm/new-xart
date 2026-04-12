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

const { data: release, pending, error, refresh } = await useAsyncData(
  () => `watch-stub:${releaseId}`,
  () => $fetch<ReleaseDetail>(`/api/releases/${releaseId}`),
)

useSeoMeta({
  title: () => (release.value ? `Watch ${release.value.title}` : 'Watch'),
  description: () =>
    release.value
      ? `Watch shell for ${release.value.title}. The full player arrives in the next stage.`
      : 'Watch shell',
})
</script>

<template>
  <div class="space-y-8 pt-8">
    <NuxtLink class="ring-link" :to="`/releases/${releaseId}`">
      Back to release
    </NuxtLink>

    <section
      v-if="pending"
      class="stack-shell min-h-[24rem] animate-pulse bg-white/55"
    />

    <section
      v-else-if="error || !release"
      class="stack-shell p-8"
    >
      <p class="tone-label">Load error</p>
      <h1 class="mt-4 font-display text-5xl leading-none text-ink">
        Watch page is unavailable
      </h1>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-muted">
        {{ error?.message || 'Release data could not be loaded for the watch shell.' }}
      </p>
      <button class="ring-link mt-6" type="button" @click="refresh()">
        Retry
      </button>
    </section>

    <section
      v-else
      class="stack-shell overflow-hidden p-6 sm:p-8 lg:p-10"
    >
      <p class="tone-label">Watch Route Reserved</p>
      <h1 class="mt-6 font-display text-5xl leading-[0.9] text-ink sm:text-6xl">
        {{ release.title }}
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-muted sm:text-base">
        This route exists so the release CTA is already wired. The next stage
        replaces this shell with the real player flow: dubber selection, source
        switching, episode list and embedded iframe playback.
      </p>

      <div class="mt-8 grid gap-4 md:grid-cols-[0.28fr_0.72fr]">
        <img
          :src="release.poster"
          :alt="release.title"
          class="w-full rounded-[2rem] object-cover"
        >

        <div class="rounded-[2rem] border border-ink/10 bg-white/60 p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Ready for next step
          </p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Status</p>
              <p class="mt-2 text-lg font-semibold text-ink">
                {{ release.status || 'release' }}
              </p>
            </article>
            <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-muted">Episodes</p>
              <p class="mt-2 text-lg font-semibold text-ink">
                {{ release.episodesReleased ?? 0 }}
                <span v-if="release.episodesTotal">/ {{ release.episodesTotal }}</span>
              </p>
            </article>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <NuxtLink class="ring-link" :to="`/releases/${releaseId}`">
              Release page
            </NuxtLink>
            <NuxtLink class="ring-link" to="/">
              Catalog
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
