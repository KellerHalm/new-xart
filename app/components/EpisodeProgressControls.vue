<script setup lang="ts">
import type { ApiCodeResponse, RawRecord } from '~~/shared/types/anix'

const props = withDefaults(
  defineProps<{
    releaseId: number
    sourceId: number | null
    episodePosition: number | null
    initialWatched?: boolean
    initialHistoryActive?: boolean
    title?: string
    authedDescription?: string
    guestDescription?: string
    compact?: boolean
  }>(),
  {
    initialWatched: false,
    initialHistoryActive: false,
    title: 'Episode controls',
    authedDescription: 'Mark watched and sync history for the active episode.',
    guestDescription: 'Sign in to persist watched state and history.',
    compact: false,
  },
)

const session = useAnixSession()

const watchedEpisodeMap = ref<Record<string, boolean>>({})
const historyTouchedMap = ref<Record<string, boolean>>({})
const actionPending = ref(false)
const actionMessage = ref<string | null>(null)

const isAuthenticated = computed(() => session.isAuthenticated.value)
const panelClass = computed(() =>
  props.compact
    ? 'rounded-[1.5rem] border border-ink/10 bg-white/55 p-4'
    : 'rounded-[1.75rem] border border-ink/10 bg-white/55 p-5',
)
const currentEpisodeKey = computed(() => {
  if (!props.sourceId || !props.episodePosition) {
    return null
  }

  return `${props.releaseId}:${props.sourceId}:${props.episodePosition}`
})
const hasEpisodeTarget = computed(() => Boolean(props.sourceId && props.episodePosition))
const isEpisodeMarkedWatched = computed(() => {
  if (!currentEpisodeKey.value) {
    return false
  }

  if (currentEpisodeKey.value in watchedEpisodeMap.value) {
    return watchedEpisodeMap.value[currentEpisodeKey.value]
  }

  return props.initialWatched
})
const hasHistoryTouch = computed(() => {
  if (!currentEpisodeKey.value) {
    return false
  }

  if (currentEpisodeKey.value in historyTouchedMap.value) {
    return Boolean(historyTouchedMap.value[currentEpisodeKey.value])
  }

  return props.initialHistoryActive
})

watch(
  () => currentEpisodeKey.value,
  () => {
    actionMessage.value = null
  },
)

async function markEpisodeWatched() {
  if (!props.sourceId || !props.episodePosition) {
    return
  }

  actionPending.value = true
  actionMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(
      `/api/episode/watch/${props.releaseId}/${props.sourceId}/${props.episodePosition}`,
    )

    if (getCode(response) === 401) {
      actionMessage.value = 'Watched state requires a valid OpenAnix session.'
      return
    }

    writeWatchedState(true)
    actionMessage.value = 'Episode marked as watched.'
  } catch (error: any) {
    actionMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Failed to mark episode as watched.'
  } finally {
    actionPending.value = false
  }
}

async function unmarkEpisodeWatched() {
  if (!props.sourceId || !props.episodePosition) {
    return
  }

  actionPending.value = true
  actionMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(
      `/api/episode/unwatch/${props.releaseId}/${props.sourceId}/${props.episodePosition}`,
    )

    if (getCode(response) === 401) {
      actionMessage.value = 'Watched state requires a valid OpenAnix session.'
      return
    }

    writeWatchedState(false)
    actionMessage.value = 'Episode marked as unwatched.'
  } catch (error: any) {
    actionMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Failed to clear watched state.'
  } finally {
    actionPending.value = false
  }
}

async function addEpisodeToHistory() {
  if (!props.sourceId || !props.episodePosition) {
    return
  }

  actionPending.value = true
  actionMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(
      `/api/history/add/${props.releaseId}/${props.sourceId}/${props.episodePosition}`,
    )

    if (getCode(response) === 401) {
      actionMessage.value = 'History actions require a valid OpenAnix session.'
      return
    }

    writeHistoryState(true)
    actionMessage.value = 'Episode added to history.'
  } catch (error: any) {
    actionMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Failed to add episode to history.'
  } finally {
    actionPending.value = false
  }
}

async function removeReleaseFromHistory() {
  actionPending.value = true
  actionMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(
      `/api/history/delete/${props.releaseId}`,
    )

    if (getCode(response) === 401) {
      actionMessage.value = 'History actions require a valid OpenAnix session.'
      return
    }

    writeHistoryState(false)
    actionMessage.value = 'Release removed from history.'
  } catch (error: any) {
    actionMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Failed to remove release from history.'
  } finally {
    actionPending.value = false
  }
}

function writeWatchedState(value: boolean) {
  if (!currentEpisodeKey.value) {
    return
  }

  watchedEpisodeMap.value = {
    ...watchedEpisodeMap.value,
    [currentEpisodeKey.value]: value,
  }
}

function writeHistoryState(value: boolean) {
  if (!currentEpisodeKey.value) {
    return
  }

  historyTouchedMap.value = {
    ...historyTouchedMap.value,
    [currentEpisodeKey.value]: value,
  }
}

function getCode(value: unknown) {
  return typeof value === 'object' && value && typeof (value as RawRecord).code === 'number'
    ? ((value as RawRecord).code as number)
    : null
}
</script>

<template>
  <div :class="panelClass">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          {{ title }}
        </p>
        <p class="mt-2 text-sm leading-6 text-muted">
          {{ isAuthenticated ? authedDescription : guestDescription }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="ring-link"
          type="button"
          :disabled="actionPending || !hasEpisodeTarget"
          @click="isEpisodeMarkedWatched ? unmarkEpisodeWatched() : markEpisodeWatched()"
        >
          {{
            actionPending
              ? 'Saving...'
              : isEpisodeMarkedWatched
                ? 'Mark unwatched'
                : 'Mark watched'
          }}
        </button>
        <button
          class="ring-link"
          type="button"
          :disabled="actionPending || !hasEpisodeTarget"
          @click="addEpisodeToHistory()"
        >
          Add history
        </button>
        <button
          class="ring-link"
          type="button"
          :disabled="actionPending"
          @click="removeReleaseFromHistory()"
        >
          Clear history
        </button>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-sm text-muted">
      <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
        {{ isEpisodeMarkedWatched ? 'Watched' : 'Not watched' }}
      </span>
      <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-2">
        {{ hasHistoryTouch ? 'History touched' : 'History idle' }}
      </span>
    </div>

    <p v-if="actionMessage" class="mt-4 text-sm text-muted">
      {{ actionMessage }}
    </p>
  </div>
</template>
