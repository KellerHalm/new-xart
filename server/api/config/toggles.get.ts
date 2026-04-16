import { anixRequest } from '../../utils/anix'
import { parseBooleanInput, parseIntegerInput } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const versionCode = parseIntegerInput(
    query.version_code ?? query.versionCode,
    0,
    0,
  )
  const isBeta = parseBooleanInput(query.is_beta ?? query.isBeta, false)

  return await anixRequest<Record<string, unknown>>('/config/toggles', {
    query: {
      version_code: versionCode,
      is_beta: isBeta,
    },
  })
})
