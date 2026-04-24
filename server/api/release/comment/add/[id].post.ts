import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'release id', 1)
  const body = await readBody(event).catch(() => undefined)

  return await anixMirrorRequest(event, `/release/comment/add/${id}`, {
    method: 'POST',
    body,
  })
})