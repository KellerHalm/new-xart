import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'comment id', 1)
  const body = await readBody(event).catch(() => undefined)

  return await anixMirrorRequest(event, `/collection/comment/edit/${id}`, {
    method: 'POST',
    body,
  })
})