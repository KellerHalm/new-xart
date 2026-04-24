import { anixMirrorRequest } from '~~/server/utils/mirror'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => undefined)

  return await anixMirrorRequest(event, '/collectionMy/create', {
    method: 'POST',
    body,
  })
})