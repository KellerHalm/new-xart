import type {
  ReleaseUserState,
  ReleaseUserStateSummaryResponse,
} from '~~/shared/types/anix'
import { normalizeReleaseDetail } from '../../utils/anix'
import { anixMirrorRequest, resolveToken } from '../../utils/mirror'

interface ReleaseResponse {
  code: number
  release: Record<string, unknown>
}

const MAX_RELEASE_IDS = 40
const PARALLEL_LIMIT = 6

export default defineEventHandler(
  async (event): Promise<ReleaseUserStateSummaryResponse> => {
    const ids = parseReleaseIds(getQuery(event).ids)

    if (!ids.length) {
      return { states: {} }
    }

    if (ids.length > MAX_RELEASE_IDS) {
      throw createError({
        statusCode: 400,
        statusMessage: `A maximum of ${MAX_RELEASE_IDS} release ids is allowed.`,
      })
    }

    if (!resolveToken(event)) {
      return {
        states: Object.fromEntries(ids.map((id) => [String(id), createDefaultUserState()])),
      }
    }

    const states = await mapWithConcurrency(ids, PARALLEL_LIMIT, async (id) => {
      try {
        const response = (await anixMirrorRequest(event, `/release/${id}`, {
          query: {
            extended_mode: true,
          },
        })) as ReleaseResponse

        return [String(id), normalizeReleaseDetail(response.release).userState] as const
      } catch {
        return [String(id), createDefaultUserState()] as const
      }
    })

    return {
      states: Object.fromEntries(states),
    }
  },
)

function parseReleaseIds(value: unknown) {
  const values = Array.isArray(value)
    ? value.flatMap(splitIds)
    : splitIds(value)

  return [...new Set(values.map(parseId).filter((id): id is number => id !== null))]
}

function splitIds(value: unknown) {
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseId(value: string) {
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
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

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  iteratee: (item: TInput) => Promise<TOutput>,
) {
  const output: TOutput[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor
      cursor += 1
      output[currentIndex] = await iteratee(items[currentIndex])
    }
  }

  const workerCount = Math.min(limit, items.length)

  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return output
}
