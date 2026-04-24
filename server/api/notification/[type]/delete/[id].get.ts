import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger, requireRouteSegment } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const type = requireRouteSegment(event.context.params?.type, 'notification type')
  const id = requireRouteInteger(event.context.params?.id, 'notification id', 1)

  return await anixMirrorRequest(event, `/notification/${type}/delete/${id}`)
})