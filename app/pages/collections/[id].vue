<script setup lang="ts">
import type { ApiCodeResponse, ApiPagedResponse, RawRecord, ReleaseCard } from '~~/shared/types/anix'

const route = useRoute()
const session = useAnixSession()
const collectionId = Number.parseInt(String(route.params.id), 10)

if (!Number.isFinite(collectionId)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Collection not found',
  })
}

await session.ensureProfileLoaded()

useSeoMeta({
  title: `Collection ${collectionId}`,
  description:
    'Collection detail page with release rail, comment feed and favorite controls backed by the OpenAnix proxy.',
})

const releasePage = computed(() => parsePositiveInt(route.query.page) || 0)

const {
  data: collectionResponse,
  pending: collectionPending,
  error: collectionError,
  refresh: refreshCollection,
} = await useAsyncData(
  () => `collection:${collectionId}:${session.token.value || 'guest'}`,
  () => session.authorizedFetch<ApiCodeResponse>(`/api/collection/${collectionId}`),
)

const {
  data: releasesResponse,
  pending: releasesPending,
  error: releasesError,
  refresh: refreshReleases,
} = await useAsyncData(
  () => `collection-releases:${collectionId}:${releasePage.value}`,
  () =>
    session.authorizedFetch<ApiPagedResponse>(
      `/api/collection/${collectionId}/releases/${releasePage.value}`,
    ),
  {
    watch: [releasePage],
  },
)

const {
  data: commentsResponse,
  pending: commentsPending,
  refresh: refreshComments,
} = await useAsyncData(
  () => `collection-comments:${collectionId}:${session.token.value || 'guest'}`,
  () =>
    session.authorizedFetch<ApiPagedResponse>(
      `/api/collection/comment/all/${collectionId}/0`,
      {
        query: {
          sort: 1,
        },
      },
    ),
)

const commentDraft = ref('')
const commentPending = ref(false)
const commentMessage = ref<string | null>(null)
const favoritePending = ref(false)
const favoriteMessage = ref<string | null>(null)

const collection = computed(
  () => toRecord((collectionResponse.value as RawRecord | undefined)?.collection),
)
const releases = computed(() =>
  getContent(releasesResponse.value).map(normalizeCollectionRelease),
)
const comments = computed(() => getContent(commentsResponse.value))

async function goToPage(page: number) {
  const query: Record<string, string> = {}

  if (page > 0) {
    query.page = String(page)
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

async function addToFavorites() {
  favoritePending.value = true
  favoriteMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(
      `/api/collectionFavorite/add/${collectionId}`,
    )

    favoriteMessage.value =
      getCode(response) === 401
        ? 'Saving a collection requires a valid OpenAnix session.'
        : 'Collection add-to-favorites request completed.'
  } catch (error: any) {
    favoriteMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Failed to add this collection to favorites.'
  } finally {
    favoritePending.value = false
  }
}

async function submitComment() {
  commentPending.value = true
  commentMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(
      `/api/collection/comment/add/${collectionId}`,
      {
        method: 'POST',
        body: {
          text: commentDraft.value,
        },
      },
    )

    commentMessage.value =
      getCode(response) === 401
        ? 'Comment submission requires a valid OpenAnix session.'
        : 'Comment request sent. Refreshing the first comment slice.'
    commentDraft.value = ''
    await refreshComments()
  } catch (error: any) {
    commentMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Failed to submit collection comment.'
  } finally {
    commentPending.value = false
  }
}

function getContent(value: ApiPagedResponse | null | undefined) {
  return Array.isArray(value?.content)
    ? value.content.filter(
        (item): item is RawRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
    : []
}

function normalizeCollectionRelease(input: RawRecord): ReleaseCard {
  return {
    id: getNumber(input.id) || 0,
    title:
      getString(input.title_ru) ||
      getString(input.title_original) ||
      'Untitled release',
    originalTitle: getString(input.title_original) || null,
    altTitle: getString(input.title_alt) || null,
    poster: getString(input.image),
    categoryName: getString(toRecord(input.category).name) || null,
    sourceLabel: getString(input.source) || null,
    year: getString(input.year) || null,
    description: getString(input.description),
    genres: getString(input.genres)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
    grade: getNumber(input.grade) || 0,
    rating: getNumber(input.rating) || 0,
    status: getString(toRecord(input.status).name) || null,
    episodesReleased: getNumber(input.episodes_released),
    episodesTotal: getNumber(input.episodes_total),
    ageRating: getNumber(input.age_rating),
    playable: input.is_play_disabled !== true,
    adult: input.is_adult === true,
    airedOnDate: getNumber(input.aired_on_date),
  }
}

function getCode(value: unknown) {
  return typeof value === 'object' && value && typeof (value as RawRecord).code === 'number'
    ? ((value as RawRecord).code as number)
    : null
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length ? value.trim() : ''
}

function parsePositiveInt(value: unknown) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function toRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawRecord)
    : {}
}

function formatTimestamp(value: unknown) {
  const stamp = getNumber(value)

  if (!stamp) {
    return 'Unknown time'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(stamp * 1000))
}
</script>

<template>
  <div class="space-y-8 pt-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <NuxtLink class="ring-link" to="/collections">
        Back to collections
      </NuxtLink>

      <div class="flex gap-3">
        <button class="ring-link" type="button" @click="refreshCollection()">
          Refresh detail
        </button>
        <button class="ring-link" type="button" @click="addToFavorites()" :disabled="favoritePending">
          {{ favoritePending ? 'Saving...' : 'Save to favorites' }}
        </button>
      </div>
    </div>

    <section
      v-if="collectionPending && !collection.id"
      class="stack-shell min-h-[18rem] animate-pulse bg-white/55"
    />

    <section
      v-else-if="collectionError"
      class="stack-shell p-8"
    >
      <p class="tone-label">Load error</p>
      <h1 class="mt-4 font-display text-5xl leading-none text-ink">
        Collection detail is unavailable
      </h1>
      <p class="mt-4 text-sm leading-7 text-muted">
        {{ collectionError.message }}
      </p>
    </section>

    <template v-else>
      <section class="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <CollectionCard :collection="collection" />

        <article class="stack-shell p-6 sm:p-8">
          <SectionHeading
            label="Details"
            :title="String(collection.title || collection.name || `Collection #${collectionId}`)"
            description="Collection detail comes from `/api/collection/:id`, while releases and comments are fetched separately."
          />

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Creator
              </p>
              <p class="mt-2 text-base font-semibold text-ink">
                {{ collection.creator?.login || 'Unknown curator' }}
              </p>
            </article>

            <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Favorite request
              </p>
              <p class="mt-2 text-sm text-muted">
                {{ favoriteMessage || 'Use the action above to save this collection.' }}
              </p>
            </article>
          </div>
        </article>
      </section>

      <section class="space-y-6">
        <SectionHeading
          label="Releases"
          title="Collection contents"
          description="Rendered through the existing anime card UI contract, but sourced from the collection release endpoint."
        >
          <div class="flex gap-3">
            <button class="ring-link disabled:pointer-events-none disabled:opacity-40" type="button" :disabled="releasePage === 0" @click="goToPage(releasePage - 1)">
              Prev
            </button>
            <button class="ring-link" type="button" @click="goToPage(releasePage + 1)">
              Next
            </button>
          </div>
        </SectionHeading>

        <div
          v-if="releasesPending"
          class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div
            v-for="index in 4"
            :key="index"
            class="stack-shell h-[28rem] animate-pulse bg-white/55"
          />
        </div>

        <div
          v-else-if="releasesError"
          class="stack-shell p-8"
        >
          <p class="tone-label">Release feed error</p>
          <p class="mt-4 text-sm leading-7 text-muted">
            {{ releasesError.message }}
          </p>
          <button class="ring-link mt-6" type="button" @click="refreshReleases()">
            Retry releases
          </button>
        </div>

        <div
          v-else-if="!releases.length"
          class="stack-shell p-8 text-sm leading-7 text-muted"
        >
          This collection page currently has no release cards in the selected slice.
        </div>

        <div
          v-else
          class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <AnimeCard
            v-for="item in releases"
            :key="item.id"
            :release="item"
          />
        </div>
      </section>

      <section class="stack-shell p-6 sm:p-8">
        <SectionHeading
          label="Comments"
          title="First comment slice"
          description="The first comment page is loaded from `/api/collection/comment/all/:id/0?sort=1`."
        />

        <form class="mt-8 space-y-4" @submit.prevent="submitComment()">
          <textarea
            v-model="commentDraft"
            rows="4"
            placeholder="Leave a note about this collection..."
            class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
          />
          <div class="flex flex-wrap items-center gap-3">
            <button class="ring-link" type="submit" :disabled="commentPending">
              {{ commentPending ? 'Sending...' : 'Post comment' }}
            </button>
            <p v-if="commentMessage" class="text-sm text-muted">
              {{ commentMessage }}
            </p>
          </div>
        </form>

        <div
          v-if="commentsPending"
          class="mt-8 grid gap-4"
        >
          <div
            v-for="index in 3"
            :key="`comment-skeleton-${index}`"
            class="stack-shell h-36 animate-pulse bg-white/55"
          />
        </div>

        <div
          v-else-if="!comments.length"
          class="mt-8 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-6 text-sm leading-6 text-muted"
        >
          No comments returned for the first collection page.
        </div>

        <div v-else class="mt-8 grid gap-4">
          <article
            v-for="item in comments"
            :key="item.id || JSON.stringify(item)"
            class="rounded-[1.75rem] border border-ink/10 bg-white/60 p-5"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm font-semibold text-ink">
                {{ item.profile?.login || 'Unknown profile' }}
              </p>
              <p class="text-xs uppercase tracking-[0.18em] text-muted">
                {{ formatTimestamp(item.timestamp) }}
              </p>
            </div>
            <p class="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
              {{ item.text || item.comment || 'OpenAnix returned a comment without body text.' }}
            </p>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
