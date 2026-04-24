export interface ReleaseCard {
  id: number
  title: string
  originalTitle: string | null
  altTitle: string | null
  poster: string
  categoryName: string | null
  sourceLabel: string | null
  year: string | null
  description: string
  genres: string[]
  grade: number
  rating: number
  status: string | null
  episodesReleased: number | null
  episodesTotal: number | null
  ageRating: number | null
  playable: boolean
  adult: boolean
  airedOnDate: number | null
}

export interface SpotlightBanner {
  id: number
  releaseId: number | null
  title: string
  description: string
  image: string
}

export interface HomePagePayload {
  spotlight: SpotlightBanner | null
  picks: SpotlightBanner[]
  latest: ReleaseCard[]
  generatedAt: number
}

export type CatalogPreset = 'latest' | 'ongoing' | 'announced' | 'films'
export type CatalogSort = 0 | 1 | 2 | 3

export interface CatalogFeedPayload {
  preset: CatalogPreset
  sort: CatalogSort
  title: string
  description: string
  total: number
  page: number
  pageCount: number
  items: ReleaseCard[]
}

export interface SearchFeedPayload {
  query: string
  total: number
  page: number
  pageCount: number
  items: ReleaseCard[]
}

export interface ReleaseDetail extends ReleaseCard {
  country: string | null
  studio: string | null
  author: string | null
  director: string | null
  duration: number | null
  releaseDate: string | null
  favoritesCount: number
  watchingCount: number
  planCount: number
  completedCount: number
  related: ReleaseCard[]
  recommended: ReleaseCard[]
}

export interface Dubber {
  id: number
  name: string
  icon: string | null
  workers: string | null
  isSub: boolean
  episodesCount: number
  viewCount: number
  pinned: boolean
}

export interface EpisodeSource {
  id: number
  name: string
  episodesCount: number
  dubberId: number
  dubberName: string | null
}

export interface EpisodeItem {
  id: number
  position: number
  name: string
  url: string
  iframe: boolean
  filler: boolean
  watched: boolean
  sourceId: number
}

export interface PlayerPayload {
  releaseId: number
  activeDubberId: number | null
  activeSourceId: number | null
  activeEpisodePosition: number | null
  dubbers: Dubber[]
  sources: EpisodeSource[]
  episodes: EpisodeItem[]
}

export type RawRecord = Record<string, unknown>

export interface ApiCodeResponse extends RawRecord {
  code?: number
}

export interface ApiPagedResponse<T = RawRecord> extends ApiCodeResponse {
  content?: T[]
  total_count?: number
  total_page_count?: number
  current_page?: number
}

export interface AuthProfile extends RawRecord {
  id?: number
  login?: string
  avatar?: string
  status?: string
  profile_cover?: string
}
