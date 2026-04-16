import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await anixMirrorRequest(event, `/channel/subscription/all/${page}`)
})
