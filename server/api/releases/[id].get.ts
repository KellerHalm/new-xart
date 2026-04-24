import { normalizeReleaseDetail } from '../../utils/anix'
import { anixMirrorRequest } from '../../utils/mirror'

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

  const response = (await anixMirrorRequest(event, `/release/${id}`, {
    query: {
      extended_mode: true,
    },
  })) as ReleaseResponse

  return normalizeReleaseDetail(response.release)
})
