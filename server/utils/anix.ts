import type {
  Dubber,
  EpisodeItem,
  EpisodeSource,
  ReleaseCard,
  ReleaseDetail,
  ReleaseUserState,
  SpotlightBanner,
} from '~~/shared/types/anix'

type RawRecord = Record<string, unknown>

interface AnixRequestOptions {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  body?: unknown
}

export async function anixRequest<T>(
  path: string,
  options: AnixRequestOptions = {},
) {
  const config = useRuntimeConfig()

  try {
    return await $fetch<T>(path, {
      baseURL: config.anix.baseUrl,
      method: options.method || 'GET',
      query: options.query,
      headers: {
        accept: 'application/json',
        ...options.headers,
      },
      body: options.body,
      timeout: 15000,
    })
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 502,
      statusMessage: `OpenAnix request failed for ${path}`,
      data: error?.data,
    })
  }
}

export function normalizeReleaseCard(input: RawRecord): ReleaseCard {
  return {
    id: getNumber(input.id),
    title:
      getString(input.title_ru) ||
      getString(input.title_original) ||
      'Untitled release',
    originalTitle: getOptionalString(input.title_original),
    altTitle: getOptionalString(input.title_alt),
    poster: getString(input.image),
    categoryName: extractNamedValue(input.category),
    sourceLabel: getOptionalString(input.source),
    year: getOptionalString(input.year),
    description: getString(input.description),
    genres: splitGenres(getOptionalString(input.genres)),
    grade: roundScore(getNumber(input.grade)),
    rating: getNumber(input.rating),
    status: extractNamedValue(input.status),
    episodesReleased: getOptionalNumber(input.episodes_released),
    episodesTotal: getOptionalNumber(input.episodes_total),
    ageRating: getOptionalNumber(input.age_rating),
    playable: !getBoolean(input.is_play_disabled),
    adult: getBoolean(input.is_adult),
    airedOnDate: getOptionalNumber(input.aired_on_date),
  }
}

export function normalizeSpotlight(input: RawRecord): SpotlightBanner {
  const releaseId = Number.parseInt(getString(input.action), 10)

  return {
    id: getNumber(input.id),
    releaseId: Number.isFinite(releaseId) ? releaseId : null,
    title: getString(input.title),
    description: getString(input.description),
    image: getString(input.image),
  }
}

export function normalizeReleaseDetail(input: RawRecord): ReleaseDetail {
  const card = normalizeReleaseCard(input)

  return {
    ...card,
    country: getOptionalString(input.country),
    studio: getOptionalString(input.studio),
    author: getOptionalString(input.author),
    director: getOptionalString(input.director),
    duration: getOptionalNumber(input.duration),
    releaseDate: getOptionalString(input.release_date),
    favoritesCount: getNumber(input.favorites_count),
    watchingCount: getNumber(input.watching_count),
    planCount: getNumber(input.plan_count),
    completedCount: getNumber(input.completed_count),
    userState: normalizeReleaseUserState(input),
    related: toRecordArray(input.related_releases).map(normalizeReleaseCard),
    recommended: toRecordArray(input.recommended_releases).map(normalizeReleaseCard),
  }
}

export function normalizeDubber(input: RawRecord): Dubber {
  return {
    id: getNumber(input.id),
    name: getString(input.name),
    icon: getOptionalString(input.icon),
    workers: getOptionalString(input.workers),
    isSub: getBoolean(input.is_sub),
    episodesCount: getNumber(input.episodes_count),
    viewCount: getNumber(input.view_count),
    pinned: getBoolean(input.pinned),
  }
}

export function normalizeSource(input: RawRecord): EpisodeSource {
  const dubber = toRecord(input.type)

  return {
    id: getNumber(input.id),
    name: getString(input.name),
    episodesCount: getNumber(input.episodes_count),
    dubberId: getNumber(dubber.id),
    dubberName: getOptionalString(dubber.name),
  }
}

export function normalizeEpisode(input: RawRecord): EpisodeItem {
  return {
    id: getNumber(input['@id'] ?? input.id),
    position: getNumber(input.position),
    name: getString(input.name),
    url: getString(input.url),
    iframe: getBoolean(input.iframe),
    filler: getBoolean(input.is_filler),
    watched: getBoolean(input.is_watched),
    sourceId: getNumber(input.sourceId),
  }
}

function normalizeReleaseUserState(input: RawRecord): ReleaseUserState {
  return {
    favorite: getBoolean(input.is_favorite),
    listStatus: extractListStatus(input.profile_list_status),
    vote: extractVoteValue(input.your_vote),
    lastViewEpisode: getPositiveNumber(input.last_view_episode),
    lastViewTimestamp: getPositiveNumber(input.last_view_timestamp),
    notificationsEnabled: getBoolean(input.is_release_type_notifications_enabled),
    viewed: getBoolean(input.is_viewed),
  }
}

function extractNamedValue(input: unknown) {
  if (!input || typeof input !== 'object') {
    return null
  }

  return getOptionalString((input as RawRecord).name)
}

function splitGenres(value: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function roundScore(value: number) {
  return Number.parseFloat(value.toFixed(1))
}

function extractListStatus(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  const record = toRecord(value)

  return (
    getPositiveNumber(record.id) ??
    getPositiveNumber(record.status_id) ??
    getPositiveNumber(record.status) ??
    getPositiveNumber(record.value) ??
    null
  )
}

function extractVoteValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  const record = toRecord(value)

  return (
    getPositiveNumber(record.vote) ??
    getPositiveNumber(record.value) ??
    getPositiveNumber(record.id) ??
    null
  )
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getOptionalString(value: unknown) {
  return typeof value === 'string' && value.length ? value : null
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function getPositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function getBoolean(value: unknown) {
  return value === true
}

function toRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {}
}

function toRecordArray(value: unknown): RawRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (entry): entry is RawRecord => Boolean(entry) && typeof entry === 'object',
  )
}
