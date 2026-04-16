import { anixRequest } from '~~/server/utils/anix'
import {
  getOptionalIntegerQuery,
  requireRouteInteger,
} from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'comment id', 1)
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)
  const query = getQuery(event)
  const sort = getOptionalIntegerQuery(query, ['sort'], 0)

  return await anixRequest<Record<string, unknown>>(
    `/release/comment/replies/${id}/${page}`,
    {
      query: {
        sort,
      },
    },
  )
})
