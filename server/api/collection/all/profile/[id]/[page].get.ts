import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'profile id', 1)
  const page = requireRouteInteger(event.context.params?.page, 'page')

  return await anixMirrorRequest(event, `/collection/all/profile/${id}/${page}`)
})