import type { PlayerPayload } from '~~/shared/types/anix'
import {
  anixRequest,
  normalizeDubber,
  normalizeEpisode,
  normalizeSource,
} from '../../../utils/anix'

interface DubberResponse {
  code: number
  types: Record<string, unknown>[]
}

interface SourceResponse {
  code: number
  sources: Record<string, unknown>[]
}

interface EpisodeResponse {
  code: number
  episodes: Record<string, unknown>[]
}

export default defineEventHandler(async (event): Promise<PlayerPayload> => {
  const id = getRouterParam(event, 'id')

  if (!id || Number.isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid release id',
    })
  }

  const query = getQuery(event)
  const requestedDubberId = Number.parseInt(String(query.dubberId || ''), 10)
  const requestedSourceId = Number.parseInt(String(query.sourceId || ''), 10)
  const requestedEpisodePosition = Number.parseInt(
    String(query.episodePosition || ''),
    10,
  )

  const dubberResponse = await anixRequest<DubberResponse>(`/episode/${id}`)
  const dubbers = dubberResponse.types.map(normalizeDubber)
  const activeDubberId =
    dubbers.find((item) => item.id === requestedDubberId)?.id || dubbers[0]?.id || null

  if (!activeDubberId) {
    return {
      releaseId: Number(id),
      activeDubberId: null,
      activeSourceId: null,
      activeEpisodePosition: null,
      dubbers: [],
      sources: [],
      episodes: [],
    }
  }

  const sourceResponse = await anixRequest<SourceResponse>(
    `/episode/${id}/${activeDubberId}`,
  )
  const sources = sourceResponse.sources.map(normalizeSource)
  const activeSourceId =
    sources.find((item) => item.id === requestedSourceId)?.id || sources[0]?.id || null

  if (!activeSourceId) {
    return {
      releaseId: Number(id),
      activeDubberId,
      activeSourceId: null,
      activeEpisodePosition: null,
      dubbers,
      sources: [],
      episodes: [],
    }
  }

  const episodeResponse = await anixRequest<EpisodeResponse>(
    `/episode/${id}/${activeDubberId}/${activeSourceId}`,
  )
  const episodes = episodeResponse.episodes.map(normalizeEpisode)
  const activeEpisodePosition =
    episodes.find((item) => item.position === requestedEpisodePosition)?.position ||
    episodes[0]?.position ||
    null

  return {
    releaseId: Number(id),
    activeDubberId,
    activeSourceId,
    activeEpisodePosition,
    dubbers,
    sources,
    episodes,
  }
})
