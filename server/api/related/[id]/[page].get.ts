import { anixRequest } from '~~/server/utils/anix'
import {
  getOptionalStringQuery,
  requireRouteInteger,
} from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'release id', 1)
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)
  const query = getQuery(event)
  const apiVersion = getOptionalStringQuery(query, ['api_version', 'apiVersion'])

  return await anixRequest<Record<string, unknown>>(`/related/${id}/${page}`, {
    headers: apiVersion
      ? {
          'Api-Version': apiVersion,
        }
      : undefined,
  })
})
