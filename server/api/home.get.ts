import type { HomePagePayload } from '~~/shared/types/anix'
import { anixRequest, normalizeReleaseCard, normalizeSpotlight } from '../utils/anix'

interface DiscoverInterestingResponse {
  code: number
  content: Record<string, unknown>[]
}

interface FilterResponse {
  code: number
  content: Record<string, unknown>[]
}

export default defineEventHandler(async (): Promise<HomePagePayload> => {
  const [interestingResponse, latestResponse] = await Promise.all([
    anixRequest<DiscoverInterestingResponse>('/discover/interesting'),
    anixRequest<FilterResponse>('/filter/0', {
      method: 'POST',
      query: {
        extended_mode: true,
      },
      body: {},
    }),
  ])

  const picks = interestingResponse.content
    .map(normalizeSpotlight)
    .filter((item) => Boolean(item.title))

  return {
    spotlight: picks[0] || null,
    picks: picks.slice(1, 5),
    latest: latestResponse.content.slice(0, 12).map(normalizeReleaseCard),
    generatedAt: Date.now(),
  }
})
