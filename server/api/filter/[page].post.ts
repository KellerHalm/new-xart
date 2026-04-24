import { anixMirrorRequest } from '~~/server/utils/mirror'
import { parseBooleanInput, requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(event.context.params?.page, 'page')
  const query = getQuery(event)
  const body = await readBody(event).catch(() => undefined)

  return await anixMirrorRequest(event, `/filter/${page}`, {
    method: 'POST',
    query: {
      extended_mode: parseBooleanInput(query.extended_mode, true),
    },
    body,
  })
})