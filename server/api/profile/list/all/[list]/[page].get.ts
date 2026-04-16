import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger, requireRouteSegment } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const list = requireRouteSegment(getRouterParam(event, 'list'), 'profile list')
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await anixMirrorRequest(event, `/profile/list/all/${list}/${page}`, {
    query: getQuery(event),
  })
})
