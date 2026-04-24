<script setup lang="ts">
import type { ApiCodeResponse, ApiPagedResponse, RawRecord } from '~~/shared/types/anix'

type NotificationTab =
  | 'all'
  | 'friends'
  | 'related'
  | 'episodes'
  | 'releaseComments'
  | 'collectionComments'
  | 'articles'

const route = useRoute()
const session = useAnixSession()

const isAuthenticated = session.isAuthenticated

await session.ensureProfileLoaded()

useSeoMeta({
  title: 'Notifications',
  description:
    'Notification center powered by the OpenAnix proxy, with feed tabs, unread count and mutation actions.',
})

const tabs: Array<{
  value: NotificationTab
  label: string
  path: (page: number) => string
  deleteType?: string
}> = [
  { value: 'all', label: 'All', path: (page) => `/api/notification/all/${page}` },
  {
    value: 'friends',
    label: 'Friends',
    path: (page) => `/api/notification/friends/${page}`,
    deleteType: 'friend',
  },
  {
    value: 'related',
    label: 'Related',
    path: (page) => `/api/notification/related/release/${page}`,
    deleteType: 'related/release',
  },
  {
    value: 'episodes',
    label: 'Episodes',
    path: (page) => `/api/notification/episodes/${page}`,
    deleteType: 'episode',
  },
  {
    value: 'releaseComments',
    label: 'Release comments',
    path: (page) => `/api/notification/releaseComments/${page}`,
    deleteType: 'releaseComment',
  },
  {
    value: 'collectionComments',
    label: 'Collection comments',
    path: (page) => `/api/notification/collectionComments/${page}`,
    deleteType: 'collectionComment',
  },
  {
    value: 'articles',
    label: 'Articles',
    path: (page) => `/api/notification/articles/${page}`,
    deleteType: 'article',
  },
]

const activeTab = computed<NotificationTab>(() => {
  const value = String(route.query.tab || 'all') as NotificationTab
  return tabs.some((entry) => entry.value === value) ? value : 'all'
})
const currentTab = computed(() => tabs.find((entry) => entry.value === activeTab.value) || tabs[0])
const pageState = computed(() => parsePositiveInt(route.query.page) || 0)

const countKey = computed(() => `notification-count:${session.token.value || 'guest'}`)
const feedKey = computed(
  () => `notifications:${activeTab.value}:${pageState.value}:${session.token.value || 'guest'}`,
)

const {
  data: countData,
  pending: countPending,
  refresh: refreshCount,
} = await useAsyncData(
  () => countKey.value,
  async () => {
    if (!isAuthenticated.value) {
      return null
    }

    return await session.authorizedFetch<ApiCodeResponse>('/api/notification/count')
  },
  {
    watch: [countKey],
  },
)

const {
  data: feedData,
  pending: feedPending,
  error: feedError,
  refresh: refreshFeed,
} = await useAsyncData(
  () => feedKey.value,
  () => session.authorizedFetch<ApiPagedResponse>(currentTab.value.path(pageState.value)),
  {
    watch: [feedKey],
  },
)

const actionPending = ref(false)
const actionMessage = ref<string | null>(null)

const notifications = computed(() => getContent(feedData.value))
const unreadCount = computed(() => getNumber((countData.value as RawRecord | undefined)?.count) || 0)
const requiresAuth = computed(
  () => !isAuthenticated.value || getCode(feedData.value) === 401 || getCode(countData.value) === 401,
)

async function syncQuery(partial: Partial<{ tab: NotificationTab; page: number }>) {
  const tab = partial.tab ?? activeTab.value
  const page = partial.page ?? pageState.value
  const query: Record<string, string> = {}

  if (tab !== 'all') {
    query.tab = tab
  }

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

async function markAllRead() {
  await runAction('/api/notification/read')
}

async function deleteAll() {
  await runAction('/api/notification/delete/all')
}

async function deleteOne(item: RawRecord) {
  const id = getNumber(item.id)

  if (!id || !currentTab.value.deleteType) {
    return
  }

  const path =
    currentTab.value.deleteType === 'related/release'
      ? `/api/notification/related/release/delete/${id}`
      : `/api/notification/${currentTab.value.deleteType}/delete/${id}`

  await runAction(path)
}

async function runAction(path: string) {
  actionPending.value = true
  actionMessage.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(path)
    actionMessage.value =
      getCode(response) === 401
        ? 'Notification action requires a valid OpenAnix session.'
        : 'Notification action completed. Refreshing feeds.'
    await Promise.all([refreshCount(), refreshFeed()])
  } catch (error: any) {
    actionMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Notification action failed.'
  } finally {
    actionPending.value = false
  }
}

function getContent(value: ApiPagedResponse | null | undefined) {
  return Array.isArray(value?.content)
    ? value.content.filter(
        (item): item is RawRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
    : []
}

function notificationTitle(item: RawRecord) {
  const episode = toRecord(item.episode)
  const release = toRecord(episode.release)
  const byProfile = toRecord(item.by_profile)
  const comment = toRecord(item.comment)

  return (
    getString(release.title_ru) ||
    getString(byProfile.login) ||
    getString(comment.text) ||
    getString(comment.message) ||
    getString(item.type) ||
    `Notification #${getNumber(item.id) || 'N/A'}`
  )
}

function notificationBody(item: RawRecord) {
  const profile = toRecord(item.profile)
  const comment = toRecord(item.comment)
  const parentComment = toRecord(item.parentComment)
  const episode = toRecord(item.episode)

  return (
    getString(comment.text) ||
    getString(comment.message) ||
    getString(parentComment.text) ||
    getString(item.status) ||
    getString(profile.login) ||
    getString(episode.name) ||
    'OpenAnix returned a sparse notification payload for this item.'
  )
}

function formatTimestamp(value: unknown) {
  const timestamp = getNumber(value)

  if (!timestamp) {
    return 'Unknown time'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp * 1000))
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
</script>

<template>
  <div class="space-y-8 pt-8">
    <section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <article class="stack-shell relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-accent-soft/10 via-transparent to-transparent lg:block" />

        <p class="tone-label">Notification center</p>
        <h1 class="mt-6 max-w-4xl font-display text-5xl leading-[0.9] text-ink sm:text-6xl lg:text-7xl">
          Unified unread counter and feed tabs for the protected OpenAnix inbox.
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Feed categories map directly to the mirrored notification endpoints and
          expose read/delete actions when the session token is valid.
        </p>

        <div class="mt-8 flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-medium transition duration-200"
            :class="
              activeTab === tab.value
                ? 'border-accent bg-accent text-white'
                : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white'
            "
            @click="syncQuery({ tab: tab.value, page: 0 })"
          >
            {{ tab.label }}
          </button>
        </div>
      </article>

      <aside class="stack-shell p-6 sm:p-8">
        <SectionHeading
          label="Inbox state"
          title="Live counters"
          description="Unread count is requested from `/api/notification/count` and refreshed after mutations."
        />

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Unread
            </p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {{ countPending ? '...' : unreadCount }}
            </p>
          </article>

          <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Active feed
            </p>
            <p class="mt-3 text-lg font-semibold text-ink">
              {{ currentTab.label }}
            </p>
          </article>

          <article class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4 sm:col-span-2">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Action status
            </p>
            <p class="mt-2 text-sm leading-6 text-muted">
              {{ actionMessage || 'Read/delete actions will refresh the current feed after completion.' }}
            </p>
          </article>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <button class="ring-link" type="button" :disabled="actionPending" @click="markAllRead()">
            Mark all read
          </button>
          <button class="ring-link" type="button" :disabled="actionPending" @click="deleteAll()">
            Delete all
          </button>
        </div>
      </aside>
    </section>

    <section
      v-if="requiresAuth"
      class="stack-shell p-8"
    >
      <p class="tone-label">Auth required</p>
      <h2 class="mt-4 font-display text-5xl leading-none text-ink">
        Notification feeds need a valid OpenAnix token
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
        The proxy keeps the feed route stable, but OpenAnix returns `401` payloads
        for notification endpoints when the session is missing or invalid.
      </p>
      <NuxtLink class="ring-link mt-6 inline-flex" to="/auth">
        Open auth workspace
      </NuxtLink>
    </section>

    <section
      v-else-if="feedPending"
      class="grid gap-4"
    >
      <div
        v-for="index in 5"
        :key="`notification-skeleton-${index}`"
        class="stack-shell h-40 animate-pulse bg-white/55"
      />
    </section>

    <section
      v-else-if="feedError"
      class="stack-shell p-8"
    >
      <p class="tone-label">Feed error</p>
      <h2 class="mt-4 font-display text-5xl leading-none text-ink">
        Notification feed is unavailable
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
        {{ feedError.message }}
      </p>
      <button class="ring-link mt-6" type="button" @click="refreshFeed()">
        Retry feed
      </button>
    </section>

    <section
      v-else-if="!notifications.length"
      class="stack-shell p-8"
    >
      <p class="tone-label">Empty feed</p>
      <h2 class="mt-4 font-display text-5xl leading-none text-ink">
        No notifications in the current slice
      </h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
        The mirrored endpoint returned an empty page for this tab.
      </p>
    </section>

    <section v-else class="space-y-4">
      <article
        v-for="item in notifications"
        :key="item.id || JSON.stringify(item)"
        class="stack-shell p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="max-w-3xl">
            <div class="flex flex-wrap gap-2">
              <span class="rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                {{ item.type || currentTab.label }}
              </span>
              <span
                v-if="item.is_new"
                class="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent"
              >
                New
              </span>
            </div>

            <h2 class="mt-4 text-2xl font-semibold text-ink">
              {{ notificationTitle(item) }}
            </h2>
            <p class="mt-3 text-sm leading-7 text-muted">
              {{ notificationBody(item) }}
            </p>
          </div>

          <div class="space-y-3 text-right">
            <p class="text-xs uppercase tracking-[0.18em] text-muted">
              {{ formatTimestamp(item.timestamp) }}
            </p>
            <button
              v-if="currentTab.deleteType"
              class="ring-link"
              type="button"
              :disabled="actionPending"
              @click="deleteOne(item)"
            >
              Delete item
            </button>
          </div>
        </div>
      </article>

      <div class="flex flex-wrap justify-between gap-4">
        <button
          class="ring-link disabled:pointer-events-none disabled:opacity-40"
          type="button"
          :disabled="pageState === 0"
          @click="syncQuery({ page: pageState - 1 })"
        >
          Prev
        </button>
        <button class="ring-link" type="button" @click="syncQuery({ page: pageState + 1 })">
          Next
        </button>
      </div>
    </section>
  </div>
</template>
