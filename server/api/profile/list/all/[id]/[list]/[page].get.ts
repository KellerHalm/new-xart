import { anixMirrorRequest } from '~~/server/utils/mirror'
import {
  requireRouteInteger,
  requireRouteSegment,
} from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'profile id', 1)
  const list = requireRouteSegment(getRouterParam(event, 'list'), 'profile list')
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await anixMirrorRequest(
    event,
    `/profile/list/all/${id}/${list}/${page}`,
    {
      query: getQuery(event),
    },
  )
})
