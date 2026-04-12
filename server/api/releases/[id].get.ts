import { anixRequest, normalizeReleaseDetail } from '../../utils/anix'

interface ReleaseResponse {
  code: number
  release: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || Number.isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid release id',
    })
  }

  const response = await anixRequest<ReleaseResponse>(`/release/${id}`, {
    query: {
      extended_mode: true,
    },
  })

  return normalizeReleaseDetail(response.release)
})
