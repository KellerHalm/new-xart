import type { CatalogPreset, CatalogSort } from '~~/shared/types/anix'

export const DEFAULT_CATALOG_PRESET: CatalogPreset = 'latest'
export const DEFAULT_CATALOG_SORT: CatalogSort = 0

export const CATALOG_PRESETS: Array<{
  value: CatalogPreset
  label: string
  title: string
  description: string
}> = [
  {
    value: 'latest',
    label: 'Latest',
    title: 'Fresh From The Feed',
    description:
      'Recently added titles with the default OpenAnix catalog profile.',
  },
  {
    value: 'ongoing',
    label: 'Ongoing',
    title: 'Currently Airing',
    description:
      'Series that are still releasing episodes and are watchable right now.',
  },
  {
    value: 'announced',
    label: 'Announced',
    title: 'Coming Soon',
    description:
      'Announced titles and early catalog entries worth tracking before release.',
  },
  {
    value: 'films',
    label: 'Films',
    title: 'Movie Shelf',
    description:
      'Feature-length and movie-format releases filtered from the main catalog.',
  },
]

export const CATALOG_SORTS: Array<{
  value: CatalogSort
  label: string
}> = [
  { value: 0, label: 'Added' },
  { value: 1, label: 'Rating' },
  { value: 2, label: 'Year' },
  { value: 3, label: 'Popularity' },
]

export function parseCatalogPreset(value: unknown): CatalogPreset {
  if (typeof value !== 'string') {
    return DEFAULT_CATALOG_PRESET
  }

  return (
    CATALOG_PRESETS.find((item) => item.value === value)?.value ||
    DEFAULT_CATALOG_PRESET
  )
}

export function parseCatalogSort(value: unknown): CatalogSort {
  const parsed = Number.parseInt(String(value ?? DEFAULT_CATALOG_SORT), 10)

  if (parsed === 1 || parsed === 2 || parsed === 3) {
    return parsed
  }

  return DEFAULT_CATALOG_SORT
}

export function parseCatalogPage(value: unknown) {
  const parsed = Number.parseInt(String(value ?? 0), 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function getCatalogPresetMeta(preset: CatalogPreset) {
  return (
    CATALOG_PRESETS.find((item) => item.value === preset) ||
    CATALOG_PRESETS[0]
  )
}

export function getCatalogBody(preset: CatalogPreset) {
  if (preset === 'ongoing') {
    return { status_id: 2 }
  }

  if (preset === 'announced') {
    return { status_id: 3 }
  }

  if (preset === 'films') {
    return { category_id: 2 }
  }

  return {}
}
