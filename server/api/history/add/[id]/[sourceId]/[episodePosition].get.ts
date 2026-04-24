import { anixMirrorRequest } from '~~/server/utils/mirror'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(event.context.params?.id, 'release id', 1)
  const sourceId = requireRouteInteger(event.context.params?.sourceId, 'source id', 1)
  const episodePosition = requireRouteInteger(event.context.params?.episodePosition, 'episode position', 1)

  return await anixMirrorRequest(event, `/history/add/${id}/${sourceId}/${episodePosition}`)
})