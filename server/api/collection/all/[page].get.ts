import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(event.context.params?.page, 'page')
  const query = getQuery(event)

  return await anixMirrorRequest(event, `/collection/all/${page}`, {
    query: {
      previous_page: query.previous_page,
      sort: query.sort,
      where: query.where,
    },
  })
})