import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteSegment } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteSegment(getRouterParam(event, 'page'), 'page')

  return await anixMirrorRequest(event, `/profile/vote/release/unvoted/${page}`)
})
