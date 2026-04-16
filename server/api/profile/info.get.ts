import { anixMirrorRequest } from '~~/server/utils/mirror'

export default defineEventHandler(async (event) => {
  return await anixMirrorRequest(event, '/profile/info')
})
