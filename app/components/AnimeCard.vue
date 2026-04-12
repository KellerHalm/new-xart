<script setup lang="ts">
import type { ReleaseCard } from '~~/shared/types/anix'

defineProps<{
  release: ReleaseCard
}>()
</script>

<template>
  <NuxtLink :to="`/releases/${release.id}`" class="group block h-full">
    <article class="stack-shell h-full overflow-hidden">
      <div class="relative aspect-[3/4] overflow-hidden bg-ink/5">
        <img
          :src="release.poster"
          :alt="release.title"
          class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        >

        <div class="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
          <span class="rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink shadow-sm">
            {{ release.year || 'TBA' }}
          </span>
          <span
            class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-sm"
            :class="
              release.playable
                ? 'bg-accent text-white'
                : 'bg-ink/80 text-white'
            "
          >
            {{ release.playable ? 'playable' : 'catalog' }}
          </span>
        </div>
      </div>

      <div class="space-y-4 p-4">
        <div class="space-y-2">
          <div class="flex flex-wrap gap-2">
            <p class="text-xs font-medium uppercase tracking-[0.22em] text-muted">
              {{ release.status || 'release' }}
            </p>
            <p
              v-if="release.categoryName"
              class="text-xs font-medium uppercase tracking-[0.22em] text-muted"
            >
              {{ release.categoryName }}
            </p>
          </div>
          <h3 class="line-clamp-2 font-display text-3xl leading-[0.92] text-ink">
            {{ release.title }}
          </h3>
          <p v-if="release.originalTitle" class="line-clamp-1 text-sm text-muted">
            {{ release.originalTitle }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="genre in release.genres.slice(0, 3)"
            :key="genre"
            class="rounded-full border border-ink/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted"
          >
            {{ genre }}
          </span>
        </div>

        <p class="line-clamp-3 text-sm leading-6 text-muted">
          {{ release.description }}
        </p>

        <div class="flex items-end justify-between gap-4 border-t border-ink/10 pt-4">
          <div>
            <p
              v-if="release.sourceLabel"
              class="mb-1 text-xs uppercase tracking-[0.18em] text-muted"
            >
              {{ release.sourceLabel }}
            </p>
            <p class="text-xs uppercase tracking-[0.18em] text-muted">Score</p>
            <p class="mt-1 text-xl font-semibold text-ink">
              {{ release.grade.toFixed(1) }}
            </p>
          </div>

          <div class="text-right">
            <p class="text-xs uppercase tracking-[0.18em] text-muted">Episodes</p>
            <p class="mt-1 text-sm font-medium text-ink">
              {{ release.episodesReleased ?? 0 }}
              <span v-if="release.episodesTotal">/ {{ release.episodesTotal }}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  </NuxtLink>
</template>
