import { anixRequest } from '~~/server/utils/anix'
import { getOptionalBooleanQuery } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const extendedMode = getOptionalBooleanQuery(query, [
    'extended_mode',
    'extendedMode',
  ])

  return await anixRequest<Record<string, unknown>>('/release/random', {
    query: {
      extended_mode: extendedMode,
    },
  })
})
