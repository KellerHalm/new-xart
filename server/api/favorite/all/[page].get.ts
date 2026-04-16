import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await anixMirrorRequest(event, `/favorite/all/${page}`, {
    query: getQuery(event),
  })
})
