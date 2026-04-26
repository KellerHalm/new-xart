import type {
  ReleaseUserState,
  ReleaseUserStateSummaryResponse,
} from '~~/shared/types/anix'

interface ReleaseUserStateSummaryOptions {
  keyPrefix?: string
}

export async function useReleaseUserStateSummary(
  releaseIdsInput: () => number[],
  options: ReleaseUserStateSummaryOptions = {},
) {
  const session = useAnixSession()
  const requestFetch = useRequestFetch()

  const releaseIds = computed(() =>
    [...new Set(releaseIdsInput().filter((id) => Number.isFinite(id) && id > 0))],
  )
  const requestKey = computed(
    () =>
      `${options.keyPrefix || 'release-user-state'}:${session.token.value || 'guest'}:${releaseIds.value.join(',')}`,
  )

  const asyncData = await useAsyncData(
    () => requestKey.value,
    async () => {
      if (!releaseIds.value.length) {
        return { states: {} } satisfies ReleaseUserStateSummaryResponse
      }

      if (!session.isAuthenticated.value) {
        return {
          states: Object.fromEntries(
            releaseIds.value.map((id) => [String(id), createDefaultUserState()]),
          ),
        } satisfies ReleaseUserStateSummaryResponse
      }

      const fetcher = import.meta.server ? requestFetch : $fetch

      return await fetcher<ReleaseUserStateSummaryResponse>('/api/releases/user-state', {
        query: {
          ids: releaseIds.value,
        },
      })
    },
    {
      watch: [releaseIds, () => session.token.value],
      default: () => ({ states: {} }),
    },
  )

  const stateMap = computed<Record<number, ReleaseUserState | null>>(() =>
    Object.fromEntries(
      releaseIds.value.map((id) => [id, asyncData.data.value?.states?.[String(id)] || null]),
    ),
  )

  return {
    ...asyncData,
    stateMap,
  }
}

function createDefaultUserState(): ReleaseUserState {
  return {
    favorite: false,
    listStatus: null,
    vote: null,
    lastViewEpisode: null,
    lastViewTimestamp: null,
    notificationsEnabled: false,
    viewed: false,
  }
}
