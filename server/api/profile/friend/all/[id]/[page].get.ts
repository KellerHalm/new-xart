import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'profile id', 1)
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await anixMirrorRequest(event, `/profile/friend/all/${id}/${page}`)
})
