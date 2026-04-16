import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger, requireRouteSegment } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const type = requireRouteSegment(
    getRouterParam(event, 'type'),
    'friend request type',
  )
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await anixMirrorRequest(event, `/profile/friend/requests/${type}/${page}`)
})
