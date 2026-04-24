import type { ApiCodeResponse, RawRecord, ReleaseUserState } from '~~/shared/types/anix'

interface ReleaseLibraryControlsOptions {
  releaseId: () => number
  initialState: () => ReleaseUserState | null | undefined
}

export const releaseListOptions = [
  { value: 1, label: 'Watching' },
  { value: 2, label: 'Plan' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'On hold' },
  { value: 5, label: 'Dropped' },
]

export function useReleaseLibraryControls(options: ReleaseLibraryControlsOptions) {
  const session = useAnixSession()

  const favoriteActive = ref(false)
  const activeList = ref<number | null>(null)
  const activeVote = ref<number | null>(null)
  const favoritePending = ref(false)
  const listPending = ref(false)
  const votePending = ref(false)
  const actionMessage = ref<string | null>(null)

  const isAuthenticated = computed(() => session.isAuthenticated.value)

  watch(
    [() => options.releaseId(), () => options.initialState()],
    () => {
      syncFromInitialState()
      actionMessage.value = null
    },
    {
      immediate: true,
      deep: true,
    },
  )

  async function toggleFavorite() {
    favoritePending.value = true
    actionMessage.value = null

    try {
      const releaseId = options.releaseId()
      const response = await session.authorizedFetch<ApiCodeResponse>(
        favoriteActive.value
          ? `/api/favorite/delete/${releaseId}`
          : `/api/favorite/add/${releaseId}`,
      )

      if (getCode(response) === 401) {
        actionMessage.value = 'Favorite action requires a valid OpenAnix session.'
        return
      }

      favoriteActive.value = !favoriteActive.value
      actionMessage.value = favoriteActive.value
        ? 'Release added to favorites.'
        : 'Release removed from favorites.'
    } catch (error: any) {
      actionMessage.value =
        error?.data?.statusMessage ||
        error?.message ||
        'Failed to update favorites.'
    } finally {
      favoritePending.value = false
    }
  }

  async function setList(list: number) {
    listPending.value = true
    actionMessage.value = null

    try {
      const response = await session.authorizedFetch<ApiCodeResponse>(
        `/api/profile/list/add/${list}/${options.releaseId()}`,
      )

      if (getCode(response) === 401) {
        actionMessage.value = 'List actions require a valid OpenAnix session.'
        return
      }

      activeList.value = list
      actionMessage.value = `Release moved to ${resolveListLabel(list)}.`
    } catch (error: any) {
      actionMessage.value =
        error?.data?.statusMessage ||
        error?.message ||
        'Failed to update release list.'
    } finally {
      listPending.value = false
    }
  }

  async function clearList() {
    if (!activeList.value) {
      return
    }

    listPending.value = true
    actionMessage.value = null

    try {
      const response = await session.authorizedFetch<ApiCodeResponse>(
        `/api/profile/list/delete/${activeList.value}/${options.releaseId()}`,
      )

      if (getCode(response) === 401) {
        actionMessage.value = 'List actions require a valid OpenAnix session.'
        return
      }

      actionMessage.value = `Release removed from ${resolveListLabel(activeList.value)}.`
      activeList.value = null
    } catch (error: any) {
      actionMessage.value =
        error?.data?.statusMessage ||
        error?.message ||
        'Failed to clear release list.'
    } finally {
      listPending.value = false
    }
  }

  async function setVote(vote: number) {
    votePending.value = true
    actionMessage.value = null

    try {
      const response = await session.authorizedFetch<ApiCodeResponse>(
        `/api/release/vote/add/${options.releaseId()}/${vote}`,
      )

      if (getCode(response) === 401) {
        actionMessage.value = 'Vote actions require a valid OpenAnix session.'
        return
      }

      activeVote.value = vote
      actionMessage.value = `Release rated ${vote}/5.`
    } catch (error: any) {
      actionMessage.value =
        error?.data?.statusMessage ||
        error?.message ||
        'Failed to set release vote.'
    } finally {
      votePending.value = false
    }
  }

  async function clearVote() {
    votePending.value = true
    actionMessage.value = null

    try {
      const response = await session.authorizedFetch<ApiCodeResponse>(
        `/api/release/vote/delete/${options.releaseId()}`,
      )

      if (getCode(response) === 401) {
        actionMessage.value = 'Vote actions require a valid OpenAnix session.'
        return
      }

      activeVote.value = null
      actionMessage.value = 'Release vote cleared.'
    } catch (error: any) {
      actionMessage.value =
        error?.data?.statusMessage ||
        error?.message ||
        'Failed to clear release vote.'
    } finally {
      votePending.value = false
    }
  }

  function resolveListLabel(value: number) {
    return releaseListOptions.find((item) => item.value === value)?.label || `List ${value}`
  }

  function syncFromInitialState() {
    const state = options.initialState()

    favoriteActive.value = Boolean(state?.favorite)
    activeList.value = normalizePositiveNumber(state?.listStatus)
    activeVote.value = normalizePositiveNumber(state?.vote)
  }

  return {
    actionMessage,
    activeList,
    activeVote,
    favoriteActive,
    favoritePending,
    isAuthenticated,
    listOptions: releaseListOptions,
    listPending,
    resolveListLabel,
    setList,
    clearList,
    toggleFavorite,
    votePending,
    clearVote,
    setVote,
  }
}

function normalizePositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function getCode(value: unknown) {
  return typeof value === 'object' && value && typeof (value as RawRecord).code === 'number'
    ? ((value as RawRecord).code as number)
    : null
}
