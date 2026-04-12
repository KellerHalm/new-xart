import type { SearchFeedPayload } from '~~/shared/types/anix'
import { anixRequest, normalizeReleaseCard } from '../utils/anix'

interface SearchResponse {
  code: number
  releases?: Record<string, unknown>[]
  content?: Record<string, unknown>[]
  total_count?: number
  total_page_count?: number
  current_page?: number
}

export default defineEventHandler(async (event): Promise<SearchFeedPayload> => {
  const query = getQuery(event)
  const q = String(query.q || '').trim()
  const page = Number.parseInt(String(query.page || '0'), 10) || 0

  if (!q) {
    return {
      query: '',
      total: 0,
      page,
      pageCount: 0,
      items: [],
    }
  }

  const response = await anixRequest<SearchResponse>(`/search/releases/${page}`, {
    method: 'POST',
    headers: {
      'Api-Version': 'v2',
    },
    body: {
      query: q,
    },
  })

  const items = response.releases || response.content || []

  return {
    query: q,
    total: response.total_count ?? items.length,
    page: response.current_page ?? page,
    pageCount: response.total_page_count ?? 0,
    items: items.map(normalizeReleaseCard),
  }
})
