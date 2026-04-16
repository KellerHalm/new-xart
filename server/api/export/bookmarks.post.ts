import { anixMirrorRequest } from '~~/server/utils/mirror'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => undefined)

  return await anixMirrorRequest(event, '/export/bookmarks', {
    method: 'POST',
    body,
  })
})
