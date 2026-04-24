<script setup lang="ts">
import type { RawRecord } from '~~/shared/types/anix'

const props = defineProps<{
  collection: RawRecord
  to?: string
}>()

const title = computed(
  () =>
    getString(props.collection.title) ||
    getString(props.collection.name) ||
    `Collection #${getNumber(props.collection.id) || 'N/A'}`,
)

const description = computed(
  () =>
    getString(props.collection.description) ||
    'OpenAnix did not return a collection description for this entry.',
)

const image = computed(
  () =>
    getString(props.collection.image) ||
    getString(props.collection.poster) ||
    getString(props.collection.cover) ||
    null,
)

const creator = computed(() => {
  const source = toRecord(props.collection.creator)

  return getString(source.login) || getString(source.name) || 'Unknown curator'
})

const releaseCount = computed(
  () =>
    getNumber(props.collection.release_count) ||
    getNumber(props.collection.releases_count) ||
    getNumber(props.collection.items_count) ||
    0,
)

const favoriteCount = computed(() => getNumber(props.collection.favorites_count) || 0)
const commentCount = computed(() => getNumber(props.collection.comments_count) || 0)
const isPrivate = computed(() => props.collection.is_private === true)
</script>

<template>
  <article class="stack-shell h-full overflow-hidden">
    <div class="relative aspect-[1.3/1] overflow-hidden bg-ink/5">
      <img
        v-if="image"
        :src="image"
        :alt="title"
        class="h-full w-full object-cover"
        loading="lazy"
      >

      <div class="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
        <span class="rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink shadow-sm">
          {{ isPrivate ? 'private' : 'public' }}
        </span>
        <span class="rounded-full bg-ink/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm">
          {{ releaseCount }} releases
        </span>
      </div>
    </div>

    <div class="space-y-4 p-5">
      <div class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Curated by {{ creator }}
        </p>
        <h3 class="line-clamp-2 font-display text-3xl leading-[0.92] text-ink">
          {{ title }}
        </h3>
      </div>

      <p class="line-clamp-3 text-sm leading-6 text-muted">
        {{ description }}
      </p>

      <div class="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        <span class="rounded-full border border-ink/10 px-2.5 py-1">
          {{ favoriteCount }} favs
        </span>
        <span class="rounded-full border border-ink/10 px-2.5 py-1">
          {{ commentCount }} comments
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <NuxtLink
          v-if="to"
          class="ring-link"
          :to="to"
        >
          Open collection
        </NuxtLink>
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>

<script lang="ts">
function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length ? value.trim() : ''
}

function toRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawRecord)
    : {}
}
</script>
