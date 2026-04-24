import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(event.context.params?.page, 'page')

  return await anixMirrorRequest(event, `/notification/friends/${page}`)
})