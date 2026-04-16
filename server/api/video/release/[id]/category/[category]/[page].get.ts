import { anixRequest } from '~~/server/utils/anix'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'release id', 1)
  const category = requireRouteInteger(
    getRouterParam(event, 'category'),
    'video category',
    0,
  )
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await anixRequest<Record<string, unknown>>(
    `/video/release/${id}/category/${category}/${page}`,
  )
})
