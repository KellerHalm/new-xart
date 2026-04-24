import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'collection id', 1)
  const body = await readRawBody(event, false).catch(() => undefined)

  return await anixMirrorRequest(event, `/collectionMy/editImage/${id}`, {
    method: 'POST',
    body,
    headers: {
      'content-type': getHeader(event, 'content-type') || undefined,
    },
  })
})