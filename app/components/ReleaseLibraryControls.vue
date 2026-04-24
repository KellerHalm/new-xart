<script setup lang="ts">
import type { ReleaseUserState } from '~~/shared/types/anix'

const props = withDefaults(
  defineProps<{
    releaseId: number
    initialState?: ReleaseUserState | null
    title?: string
    authedDescription?: string
    guestDescription?: string
    compact?: boolean
    showClearList?: boolean
  }>(),
  {
    initialState: null,
    title: 'Library controls',
    authedDescription: 'Library mutations are available for the active session.',
    guestDescription: 'Sign in to persist favorite, list and vote actions.',
    compact: false,
    showClearList: true,
  },
)

const controls = useReleaseLibraryControls({
  releaseId: () => props.releaseId,
  initialState: () => props.initialState,
})

const panelClass = computed(() =>
  props.compact
    ? 'rounded-[1.5rem] border border-ink/10 bg-white/60 p-4'
    : 'rounded-[1.75rem] border border-ink/10 bg-white/60 p-5',
)
const actionButtonClass = computed(() =>
  props.compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm',
)
</script>

<template>
  <div :class="panelClass">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          {{ title }}
        </p>
        <p class="mt-2 text-sm leading-6 text-muted">
          {{ controls.isAuthenticated ? authedDescription : guestDescription }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="ring-link"
          type="button"
          :disabled="controls.favoritePending"
          @click="controls.toggleFavorite()"
        >
          {{
            controls.favoritePending
              ? 'Saving...'
              : controls.favoriteActive
                ? 'Unfavorite'
                : 'Favorite'
          }}
        </button>
        <button
          class="ring-link"
          type="button"
          :disabled="controls.votePending || controls.activeVote === null"
          @click="controls.clearVote()"
        >
          Clear vote
        </button>
        <button
          v-if="showClearList"
          class="ring-link"
          type="button"
          :disabled="controls.listPending || controls.activeList === null"
          @click="controls.clearList()"
        >
          Clear list
        </button>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap gap-2">
      <button
        v-for="item in controls.listOptions"
        :key="`list-${item.value}`"
        type="button"
        class="rounded-full border font-medium transition duration-200"
        :class="[
          actionButtonClass,
          controls.activeList === item.value
            ? 'border-accent bg-accent text-white'
            : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white',
        ]"
        :disabled="controls.listPending"
        @click="controls.setList(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="vote in 5"
        :key="`vote-${vote}`"
        type="button"
        class="rounded-full border font-medium transition duration-200"
        :class="[
          actionButtonClass,
          controls.activeVote === vote
            ? 'border-ink bg-ink text-white'
            : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white',
        ]"
        :disabled="controls.votePending"
        @click="controls.setVote(vote)"
      >
        {{ vote }}/5
      </button>
    </div>

    <p v-if="controls.actionMessage" class="mt-4 text-sm text-muted">
      {{ controls.actionMessage }}
    </p>
  </div>
</template>
