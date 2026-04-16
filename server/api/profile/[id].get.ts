import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'profile id', 1)

  return await anixMirrorRequest(event, `/profile/${id}`)
})
