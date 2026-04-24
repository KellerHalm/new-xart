import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'collection id', 1)
  const query = getQuery(event)

  return await anixMirrorRequest(event, `/collectionMy/release/add/${id}`, {
    query: {
      release_id: query.release_id,
    },
  })
})