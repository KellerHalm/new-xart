export function parseIntegerInput(
  value: unknown,
  fallback = 0,
  minimum = 0,
) {
  const parsed = Number.parseInt(String(value ?? ''), 10)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(minimum, parsed)
}

export function parseBooleanInput(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
      return true
    }

    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
      return false
    }
  }

  return fallback
}

export function requireRouteInteger(
  value: string | undefined,
  label: string,
  minimum = 0,
) {
  const parsed = Number.parseInt(String(value ?? ''), 10)

  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${label}`,
    })
  }

  return parsed
}

export function requireRouteSegment(value: string | undefined, label: string) {
  const normalized = String(value ?? '').trim()

  if (!normalized.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${label}`,
    })
  }

  return normalized
}

export function getOptionalIntegerQuery(
  query: Record<string, unknown>,
  keys: string[],
  minimum = 0,
) {
  for (const key of keys) {
    if (!(key in query)) {
      continue
    }

    const parsed = Number.parseInt(String(query[key] ?? ''), 10)

    if (Number.isFinite(parsed) && parsed >= minimum) {
      return parsed
    }
  }

  return undefined
}

export function getOptionalBooleanQuery(
  query: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    if (key in query) {
      return parseBooleanInput(query[key], false)
    }
  }

  return undefined
}

export function getOptionalStringQuery(
  query: Record<string, unknown>,
  keys: string[],
  fallback?: string,
) {
  for (const key of keys) {
    const value = query[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return fallback
}
