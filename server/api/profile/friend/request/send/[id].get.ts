import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'profile id', 1)

  return await anixMirrorRequest(event, `/profile/friend/request/send/${id}`)
})