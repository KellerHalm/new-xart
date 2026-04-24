import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'comment id', 1)
  const page = requireRouteInteger(event.context.params?.page, 'page')
  const query = getQuery(event)

  return await anixMirrorRequest(event, `/collection/comment/votes/${id}/${page}`, {
    query: {
      sort: query.sort,
    },
  })
})