<script setup lang="ts">
import type { ReleaseCard, ReleaseUserState } from '~~/shared/types/anix'

defineProps<{
  release: ReleaseCard
  userState?: ReleaseUserState | null
}>()
</script>

<template>
  <article class="stack-shell overflow-hidden">
    <NuxtLink
      :to="`/releases/${release.id}`"
      class="group block"
    >
      <div class="flex h-full gap-4 p-4">
        <img
          :src="release.poster"
          :alt="release.title"
          class="h-28 w-20 rounded-[1.35rem] object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        >

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              {{ release.status || 'release' }}
            </p>
            <p
              v-if="release.year"
              class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              {{ release.year }}
            </p>
          </div>

          <h3 class="mt-2 line-clamp-2 text-lg font-semibold leading-tight text-ink">
            {{ release.title }}
          </h3>

          <p
            v-if="release.originalTitle"
            class="mt-1 line-clamp-1 text-sm text-muted"
          >
            {{ release.originalTitle }}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="genre in release.genres.slice(0, 2)"
              :key="genre"
              class="rounded-full border border-ink/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted"
            >
              {{ genre }}
            </span>
          </div>

          <div class="mt-4 flex items-center justify-between gap-3 text-sm">
            <p class="font-semibold text-ink">{{ release.grade.toFixed(1) }}</p>
            <p class="text-muted">
              {{ release.episodesReleased ?? 0 }}
              <span v-if="release.episodesTotal">/ {{ release.episodesTotal }}</span>
            </p>
          </div>
        </div>
      </div>
    </NuxtLink>

    <div class="border-t border-ink/10 p-4 pt-3">
      <ReleaseLibraryControls
        :release-id="release.id"
        :initial-state="userState"
        compact
        :show-clear-list="false"
        title="Quick actions"
        authed-description="Apply favorite, list and vote changes inline."
        guest-description="Sign in to use inline library actions."
      />
    </div>
  </article>
</template>
