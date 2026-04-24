import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const list = requireRouteInteger(event.context.params?.list, 'list')
  const id = requireRouteInteger(event.context.params?.id, 'release id', 1)

  return await anixMirrorRequest(event, `/profile/list/delete/${list}/${id}`)
})