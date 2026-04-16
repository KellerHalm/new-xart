import { anixRequest } from '../../utils/anix'

export default defineEventHandler(async () => {
  return await anixRequest<Record<string, unknown>>('/discover/discussing')
})
