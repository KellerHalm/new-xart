import {
  getCatalogBody,
  getCatalogPresetMeta,
  parseCatalogPage,
  parseCatalogPreset,
  parseCatalogSort,
} from '~~/shared/constants/catalog'
import type { CatalogFeedPayload } from '~~/shared/types/anix'
import { anixRequest, normalizeReleaseCard } from '../utils/anix'

interface FilterResponse {
  code: number
  content: Record<string, unknown>[]
  total_count: number
  total_page_count: number
  current_page: number
}

export default defineEventHandler(async (event): Promise<CatalogFeedPayload> => {
  const query = getQuery(event)
  const preset = parseCatalogPreset(query.preset)
  const sort = parseCatalogSort(query.sort)
  const page = parseCatalogPage(query.page)
  const presetMeta = getCatalogPresetMeta(preset)

  const response = await anixRequest<FilterResponse>(`/filter/${page}`, {
    method: 'POST',
    query: {
      extended_mode: true,
    },
    body: {
      ...getCatalogBody(preset),
      sort,
    },
  })

  return {
    preset,
    sort,
    title: presetMeta.title,
    description: presetMeta.description,
    total: response.total_count,
    page: response.current_page,
    pageCount: response.total_page_count,
    items: response.content.map(normalizeReleaseCard),
  }
})
