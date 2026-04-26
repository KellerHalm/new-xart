interface AnixMirrorOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string | undefined>
  body?: unknown
  query?: Record<string, unknown>
  forwardAuth?: boolean
}

const DEFAULT_ANIX_USER_AGENT =
  'AnixartApp/9.0 BETA 9-25110702 (Android 13; SDK 33; x86_64; Waydroid WayDroid x86_64 Device; en)'

export async function anixMirrorRequest(
  event: any,
  path: string,
  options: AnixMirrorOptions = {},
) {
  const config = useRuntimeConfig()
  const query = withForwardedAuthQuery(
    event,
    options.query,
    options.forwardAuth !== false,
  )
  const url = buildMirroredUrl(config.anix.baseUrl, path, query)
  const payload = resolveBodyPayload(options.body)
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      accept: 'application/json',
      'user-agent': resolveUserAgentHeader(event, options.headers),
      ...resolveApiVersionHeader(event, options.headers),
      ...filterHeaders(options.headers),
      ...resolveContentTypeHeader(options.headers, options.body),
    },
    body: payload,
  })

  const text = await response.text()
  const contentType = response.headers.get('content-type')

  if (contentType) {
    setHeader(event, 'content-type', contentType)
  }

  setResponseStatus(event, response.status, response.statusText)

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAnix request failed for ${path}`,
      data: tryParseResponseBody(text),
    })
  }

  if (!text.length) {
    return ''
  }

  return tryParseResponseBody(text)
}

function filterHeaders(headers: Record<string, string | undefined> = {}) {
  return Object.fromEntries(
    Object.entries(headers).filter(([, value]) => typeof value === 'string' && value.length),
  )
}

function resolveUserAgentHeader(
  event: any,
  headers: Record<string, string | undefined> = {},
) {
  return (
    headers['user-agent'] ||
    headers['User-Agent'] ||
    getHeader(event, 'user-agent') ||
    DEFAULT_ANIX_USER_AGENT
  )
}

function resolveApiVersionHeader(
  event: any,
  headers: Record<string, string | undefined> = {},
) {
  if (headers['api-version'] || headers['Api-Version']) {
    return {}
  }

  const value = getHeader(event, 'api-version')

  return value ? { 'api-version': value } : {}
}

function resolveContentTypeHeader(
  headers: Record<string, string | undefined> = {},
  body: unknown,
) {
  if (headers['content-type'] || headers['Content-Type'] || body === undefined) {
    return {}
  }

  if (isBodyInit(body)) {
    return {}
  }

  return {
    'content-type': 'application/json',
  }
}

function resolveBodyPayload(body: unknown) {
  if (body === undefined) {
    return undefined
  }

  if (isBodyInit(body)) {
    return body
  }

  return JSON.stringify(body)
}

function withForwardedAuthQuery(
  event: any,
  query: Record<string, unknown> = {},
  forwardAuth = true,
) {
  const result = { ...query }

  if (!forwardAuth || hasTokenQuery(result)) {
    return result
  }

  const token = resolveToken(event)

  if (token) {
    result.token = token
  }

  return result
}

function hasTokenQuery(query: Record<string, unknown>) {
  const value = query.token

  if (Array.isArray(value)) {
    return value.some((item) => typeof item === 'string' && item.length)
  }

  return typeof value === 'string' && value.length
}

export function resolveToken(event: any) {
  const query = getQuery(event)
  const queryToken = firstStringValue(query.token)

  if (queryToken) {
    return queryToken
  }

  const headerToken =
    parseBearerToken(getHeader(event, 'authorization')) ||
    getHeader(event, 'x-anix-token') ||
    getHeader(event, 'x-auth-token') ||
    getHeader(event, 'token')

  if (headerToken) {
    return headerToken
  }

  return (
    getCookie(event, 'token') ||
    getCookie(event, 'anix_token') ||
    getCookie(event, 'anixToken') ||
    undefined
  )
}

function parseBearerToken(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const match = value.match(/^Bearer\s+(.+)$/i)

  return match?.[1]?.trim() || undefined
}

function firstStringValue(value: unknown) {
  if (typeof value === 'string' && value.length) {
    return value
  }

  if (Array.isArray(value)) {
    return value.find(
      (item): item is string => typeof item === 'string' && item.length > 0,
    )
  }

  return undefined
}

function isBodyInit(value: unknown): value is BodyInit {
  if (typeof value === 'string' || value instanceof URLSearchParams) {
    return true
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return true
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true
  }

  if (value instanceof ArrayBuffer) {
    return true
  }

  return ArrayBuffer.isView(value)
}

function tryParseResponseBody(text: string) {
  if (!text.length) {
    return ''
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function buildMirroredUrl(
  baseUrl: string,
  path: string,
  query: Record<string, unknown> = {},
) {
  const url = new URL(path, baseUrl)

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== '') {
          url.searchParams.append(key, String(item))
        }
      }

      continue
    }

    url.searchParams.set(key, String(value))
  }

  return url
}
