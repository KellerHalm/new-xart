import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'role id', 1)

  return await anixMirrorRequest(event, `/role/all/${page}/${id}`)
})
