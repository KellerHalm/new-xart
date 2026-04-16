interface AnixMirrorOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string | undefined>
  body?: unknown
  query?: Record<string, unknown>
}

export async function anixMirrorRequest(
  event: any,
  path: string,
  options: AnixMirrorOptions = {},
) {
  const config = useRuntimeConfig()
  const url = buildMirroredUrl(config.anix.baseUrl, path, options.query)
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      accept: 'application/json',
      ...filterHeaders(options.headers),
      ...(options.body !== undefined
        ? {
            'content-type': 'application/json',
          }
        : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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
