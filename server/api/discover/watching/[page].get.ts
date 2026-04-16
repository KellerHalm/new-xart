import { anixRequest } from '../../../utils/anix'
import { parseIntegerInput } from '../../../utils/query'

export default defineEventHandler(async (event) => {
  const page = parseIntegerInput(getRouterParam(event, 'page'), 0, 0)

  return await anixRequest<Record<string, unknown>>(`/discover/watching/${page}`)
})
