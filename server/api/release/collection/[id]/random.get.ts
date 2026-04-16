import { anixRequest } from '~~/server/utils/anix'
import {
  getOptionalBooleanQuery,
  requireRouteInteger,
} from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(
    getRouterParam(event, 'id'),
    'release collection id',
    1,
  )
  const query = getQuery(event)
  const extendedMode = getOptionalBooleanQuery(query, [
    'extended_mode',
    'extendedMode',
  ])

  return await anixRequest<Record<string, unknown>>(
    `/release/collection/${id}/random`,
    {
      query: {
        extended_mode: extendedMode,
      },
    },
  )
})
