<script setup lang="ts">
import type { ApiCodeResponse, ApiPagedResponse, RawRecord } from '~~/shared/types/anix'

const route = useRoute()
const session = useAnixSession()

const isAuthenticated = session.isAuthenticated
const profileId = session.profileId

await session.ensureProfileLoaded()

useSeoMeta({
  title: 'Collections',
  description:
    'Browse public OpenAnix collections, inspect collection details, manage favorites and create your own lists from the OpenXart UI.',
})

const collectionSorts = [
  { value: 1, label: 'All-time popular' },
  { value: 2, label: 'This year' },
  { value: 3, label: 'This season' },
  { value: 4, label: 'This week' },
  { value: 5, label: 'Recently added' },
  { value: 6, label: 'Random' },
]

const pageState = computed(() => parsePositiveInt(route.query.page) || 0)
const sortState = computed(() => {
  const parsed = parsePositiveInt(route.query.sort)
  return collectionSorts.some((entry) => entry.value === parsed) ? parsed || 5 : 5
})

const publicKey = computed(
  () => `collections:${pageState.value}:${sortState.value}:${session.token.value || 'guest'}`,
)
const favoriteKey = computed(() => `collections:favorites:${session.token.value || 'guest'}`)
const mineKey = computed(() => `collections:mine:${profileId.value || 'guest'}`)

const {
  data: publicData,
  pending: publicPending,
  error: publicError,
  refresh: refreshPublic,
} = await useAsyncData(
  () => publicKey.value,
  () =>
    session.authorizedFetch<ApiPagedResponse>(`/api/collection/all/${pageState.value}`, {
      query: {
        previous_page: Math.max(pageState.value - 1, -1),
        sort: sortState.value,
      },
    }),
  {
    watch: [publicKey],
  },
)

const {
  data: favoriteData,
  pending: favoritePending,
  refresh: refreshFavorites,
} = await useAsyncData(
  () => favoriteKey.value,
  async () => {
    if (!isAuthenticated.value) {
      return null
    }

    return await session.authorizedFetch<ApiPagedResponse>('/api/collectionFavorite/all/0')
  },
  {
    watch: [favoriteKey],
  },
)

const {
  data: mineData,
  pending: minePending,
  refresh: refreshMine,
} = await useAsyncData(
  () => mineKey.value,
  async () => {
    if (!profileId.value) {
      return null
    }

    return await session.authorizedFetch<ApiPagedResponse>(
      `/api/collection/all/profile/${profileId.value}/0`,
    )
  },
  {
    watch: [mineKey],
  },
)

const createForm = reactive({
  title: '',
  description: '',
  isPrivate: false,
})

const createPending = ref(false)
const createMessage = ref<string | null>(null)
const favoritePendingId = ref<number | null>(null)
const deletePendingId = ref<number | null>(null)

const publicCollections = computed(() => getContent(publicData.value))
const favoriteCollections = computed(() => getContent(favoriteData.value))
const mineCollections = computed(() => getContent(mineData.value))

const favoriteIds = computed(() => {
  return new Set(
    favoriteCollections.value
      .map((item) => collectionId(item))
      .filter((value): value is number => Boolean(value)),
  )
})

const publicTotal = computed(() => getNumber(publicData.value?.total_count) || 0)
const publicPageCount = computed(() => getNumber(publicData.value?.total_page_count) || 0)
const canGoPrev = computed(() => pageState.value > 0)
const canGoNext = computed(() => pageState.value < publicPageCount.value)

async function syncQuery(partial: Partial<{ page: number; sort: number }>) {
  const nextPage = partial.page ?? pageState.value
  const nextSort = partial.sort ?? sortState.value
  const query: Record<string, string> = {}

  if (nextPage > 0) {
    query.page = String(nextPage)
  }

  if (nextSort !== 5) {
    query.sort = String(nextSort)
  }

  await navigateTo(
    {
      path: route.path,
      query,
    },
    {
      replace: true,
    },
  )
}

async function createCollection() {
  createPending.value = true
  createMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>('/api/collectionMy/create', {
      method: 'POST',
      body: {
        title: createForm.title,
        description: createForm.description,
        is_private: createForm.isPrivate,
      },
    })

    createMessage.value =
      getCode(response) === 401
        ? 'Collection creation requires a valid OpenAnix session.'
        : 'Collection request sent. Refreshing your collection lists.'

    createForm.title = ''
    createForm.description = ''
    createForm.isPrivate = false
    await Promise.all([refreshMine(), refreshPublic()])
  } catch (error: any) {
    createMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Failed to create collection.'
  } finally {
    createPending.value = false
  }
}

async function toggleFavorite(item: RawRecord) {
  const id = collectionId(item)

  if (!id) {
    return
  }

  favoritePendingId.value = id

  try {
    await session.authorizedFetch(
      favoriteIds.value.has(id)
        ? `/api/collectionFavorite/delete/${id}`
        : `/api/collectionFavorite/add/${id}`,
    )
    await refreshFavorites()
  } finally {
    favoritePendingId.value = null
  }
}

async function deleteCollection(item: RawRecord) {
  const id = collectionId(item)

  if (!id) {
    return
  }

  deletePendingId.value = id

  try {
    await session.authorizedFetch(`/api/collectionMy/delete/${id}`)
    await Promise.all([refreshMine(), refreshPublic(), refreshFavorites()])
  } finally {
    deletePendingId.value = null
  }
}

function collectionId(item: RawRecord) {
  return getNumber(item.id) || getNumber(item['@id'])
}

function getContent(value: ApiPagedResponse | null | undefined) {
  return Array.isArray(value?.content)
    ? value.content.filter(
        (item): item is RawRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
    : []
}

function getCode(value: unknown) {
  return typeof value === 'object' && value && typeof (value as RawRecord).code === 'number'
    ? ((value as RawRecord).code as number)
    : null
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parsePositiveInt(value: unknown) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}
</script>

<template>
  <div class="space-y-8 pt-8">
    <section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <article class="stack-shell relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-accent-soft/10 via-transparent to-transparent lg:block" />

        <p class="tone-label">Collection explorer</p>
        <h1 class="mt-6 max-w-4xl font-display text-5xl leading-[0.9] text-ink sm:text-6xl lg:text-7xl">
          Public collection discovery plus personal list management.
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          This page combines public collection discovery with your favorites and
          your own profile collections when a valid session is available.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <button
            v-for="entry in collectionSorts"
            :key="entry.value"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-medium transition duration-200"
            :class="
              sortState === entry.value
                ? 'border-accent bg-accent text-white'
                : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white'
            "
            @click="syncQuery({ sort: entry.value, page: 0 })"
          >
            {{ entry.label }}
          </button>
        </div>
      </article>

      <aside class="stack-shell p-6 sm:p-8">
        <SectionHeading
          label="Summary"
          title="Collection state"
          description="Public collections stay available anonymously. Favorite and personal lists require a token-backed OpenAnix session."
        />

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Public results
            </p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {{ publicTotal }}
            </p>
          </article>

          <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Favorites loaded
            </p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {{ favoriteCollections.length }}
            </p>
          </article>

          <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              My collections
            </p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {{ mineCollections.length }}
            </p>
          </article>

          <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Session
            </p>
            <p class="mt-3 text-lg font-semibold text-ink">
              {{ isAuthenticated ? 'Authorized' : 'Guest only' }}
            </p>
          </article>
        </div>
      </aside>
    </section>

    <section class="space-y-6">
      <SectionHeading
        label="Public feed"
        title="Discover collections"
        description="OpenAnix public collection discovery mirrored through `/api/collection/all/:page`."
      >
        <div class="flex gap-3">
          <button
            class="ring-link disabled:pointer-events-none disabled:opacity-40"
            type="button"
            :disabled="!canGoPrev"
            @click="syncQuery({ page: pageState - 1 })"
          >
            Prev
          </button>
          <button
            class="ring-link disabled:pointer-events-none disabled:opacity-40"
            type="button"
            :disabled="!canGoNext"
            @click="syncQuery({ page: pageState + 1 })"
          >
            Next
          </button>
        </div>
      </SectionHeading>

      <div
        v-if="publicPending"
        class="grid gap-5 lg:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="stack-shell h-[26rem] animate-pulse bg-white/55"
        />
      </div>

      <div
        v-else-if="publicError"
        class="stack-shell p-8"
      >
        <p class="tone-label">Load error</p>
        <h2 class="mt-4 font-display text-5xl leading-none text-ink">
          Public collection feed is unavailable
        </h2>
        <p class="mt-4 text-sm leading-7 text-muted">
          {{ publicError.message }}
        </p>
        <button class="ring-link mt-6" type="button" @click="refreshPublic()">
          Retry feed
        </button>
      </div>

      <div
        v-else
        class="grid gap-5 lg:grid-cols-2 xl:grid-cols-3"
      >
        <CollectionCard
          v-for="item in publicCollections"
          :key="collectionId(item) || JSON.stringify(item)"
          :collection="item"
          :to="collectionId(item) ? `/collections/${collectionId(item)}` : undefined"
        >
          <template #actions>
            <button
              v-if="isAuthenticated && collectionId(item)"
              class="ring-link"
              type="button"
              :disabled="favoritePendingId === collectionId(item)"
              @click="toggleFavorite(item)"
            >
              {{
                favoritePendingId === collectionId(item)
                  ? 'Saving...'
                  : favoriteIds.has(collectionId(item) || -1)
                    ? 'Unsave'
                    : 'Save'
              }}
            </button>
          </template>
        </CollectionCard>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <div class="stack-shell p-6 sm:p-8">
        <SectionHeading
          label="Favorites"
          title="Saved collections"
          description="Rendered from `/api/collectionFavorite/all/0` for the active session."
        />

        <div
          v-if="!isAuthenticated"
          class="mt-8 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-6 text-sm leading-6 text-muted"
        >
          Sign in to view and manage favorite collections.
        </div>

        <div
          v-else-if="favoritePending"
          class="mt-8 grid gap-4"
        >
          <div
            v-for="index in 2"
            :key="`favorite-skeleton-${index}`"
            class="stack-shell h-56 animate-pulse bg-white/55"
          />
        </div>

        <div
          v-else-if="!favoriteCollections.length"
          class="mt-8 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-6 text-sm leading-6 text-muted"
        >
          No favorite collections returned yet.
        </div>

        <div v-else class="mt-8 grid gap-4">
          <CollectionCard
            v-for="item in favoriteCollections"
            :key="`favorite-${collectionId(item) || JSON.stringify(item)}`"
            :collection="item"
            :to="collectionId(item) ? `/collections/${collectionId(item)}` : undefined"
          >
            <template #actions>
              <button
                class="ring-link"
                type="button"
                :disabled="favoritePendingId === collectionId(item)"
                @click="toggleFavorite(item)"
              >
                Remove
              </button>
            </template>
          </CollectionCard>
        </div>
      </div>

      <div class="stack-shell p-6 sm:p-8">
        <SectionHeading
          label="My lists"
          title="Create and manage"
          description="Create collections through `/api/collectionMy/create` and remove them through `/api/collectionMy/delete/:id`."
        />

        <div
          v-if="!isAuthenticated"
          class="mt-8 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-6 text-sm leading-6 text-muted"
        >
          Collection creation and personal lists are available after sign-in.
        </div>

        <template v-else>
          <form class="mt-8 grid gap-4" @submit.prevent="createCollection()">
            <label class="space-y-2">
              <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Title</span>
              <input
                v-model="createForm.title"
                type="text"
                class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
              >
            </label>
            <label class="space-y-2">
              <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Description</span>
              <textarea
                v-model="createForm.description"
                rows="4"
                class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
              />
            </label>
            <label class="flex items-center gap-3 text-sm text-muted">
              <input v-model="createForm.isPrivate" type="checkbox" class="h-4 w-4 rounded border-ink/20">
              Private collection
            </label>
            <div class="flex flex-wrap items-center gap-3">
              <button class="ring-link" type="submit" :disabled="createPending">
                {{ createPending ? 'Creating...' : 'Create collection' }}
              </button>
              <p v-if="createMessage" class="text-sm text-muted">
                {{ createMessage }}
              </p>
            </div>
          </form>

          <div
            v-if="minePending"
            class="mt-8 grid gap-4"
          >
            <div
              v-for="index in 2"
              :key="`mine-skeleton-${index}`"
              class="stack-shell h-56 animate-pulse bg-white/55"
            />
          </div>

          <div
            v-else-if="!mineCollections.length"
            class="mt-8 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-6 text-sm leading-6 text-muted"
          >
            Your profile has no collections in the first page slice yet.
          </div>

          <div v-else class="mt-8 grid gap-4">
            <CollectionCard
              v-for="item in mineCollections"
              :key="`mine-${collectionId(item) || JSON.stringify(item)}`"
              :collection="item"
              :to="collectionId(item) ? `/collections/${collectionId(item)}` : undefined"
            >
              <template #actions>
                <button
                  class="ring-link"
                  type="button"
                  :disabled="deletePendingId === collectionId(item)"
                  @click="deleteCollection(item)"
                >
                  {{ deletePendingId === collectionId(item) ? 'Deleting...' : 'Delete' }}
                </button>
              </template>
            </CollectionCard>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
