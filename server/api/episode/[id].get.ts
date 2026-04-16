import { anixRequest } from '~~/server/utils/anix'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'release id', 1)

  return await anixRequest<Record<string, unknown>>(`/episode/${id}`)
})
