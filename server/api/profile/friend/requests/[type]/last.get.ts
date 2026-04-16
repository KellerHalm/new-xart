import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteSegment } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const type = requireRouteSegment(
    getRouterParam(event, 'type'),
    'friend request type',
  )

  return await anixMirrorRequest(event, `/profile/friend/requests/${type}/last`, {
    query: getQuery(event),
  })
})
