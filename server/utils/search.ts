import { anixMirrorRequest } from './mirror'
import { getOptionalStringQuery } from './query'

interface SearchForwardOptions {
  apiVersion?: string
}

export async function forwardSearchPost(
  event: any,
  path: string,
  options: SearchForwardOptions = {},
) {
  const body = await readBody(event).catch(() => undefined)
  const apiVersion = resolveApiVersion(event, options.apiVersion)

  return await anixMirrorRequest(event, path, {
    method: 'POST',
    headers: apiVersion
      ? {
          'Api-Version': apiVersion,
        }
      : undefined,
    body,
  })
}

export function resolveApiVersion(event: any, fallback?: string) {
  const headerValue = event.node.req.headers['api-version']
  const normalizedHeader =
    typeof headerValue === 'string'
      ? headerValue
      : Array.isArray(headerValue)
        ? headerValue[0]
        : undefined

  return getOptionalStringQuery(
    getQuery(event),
    ['api_version', 'apiVersion'],
    normalizedHeader || fallback,
  )
}
