import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteSegment } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteSegment(getRouterParam(event, 'id'), 'achievement id')

  return await anixMirrorRequest(event, `/achivement/get/${id}`)
})
