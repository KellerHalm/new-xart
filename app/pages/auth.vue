<script setup lang="ts">
import type { ApiCodeResponse, RawRecord } from '~~/shared/types/anix'

type AuthMode =
  | 'signIn'
  | 'signUp'
  | 'verify'
  | 'restore'
  | 'restoreVerify'

const session = useAnixSession()

const profile = session.profile
const isAuthenticated = session.isAuthenticated
const profilePending = session.profilePending
const displayName = session.displayName
const avatarUrl = session.avatarUrl
const statusText = session.statusText
const token = session.token

await session.ensureProfileLoaded()

useSeoMeta({
  title: 'Auth Workspace',
  description:
    'Manage OpenAnix session state, sign in, verify registration, restore access and export bookmarks.',
})

const authModes: Array<{ value: AuthMode; label: string }> = [
  { value: 'signIn', label: 'Sign in' },
  { value: 'signUp', label: 'Sign up' },
  { value: 'verify', label: 'Verify sign-up' },
  { value: 'restore', label: 'Restore' },
  { value: 'restoreVerify', label: 'Restore verify' },
]

const activeMode = ref<AuthMode>('signIn')
const actionPending = ref(false)
const actionMessage = ref<string | null>(null)
const actionResponse = ref<RawRecord | null>(null)
const actionTone = ref<'default' | 'success' | 'warning'>('default')

const signInForm = reactive({
  login: '',
  password: '',
})

const signUpForm = reactive({
  email: '',
  login: '',
  password: '',
})

const verifyForm = reactive({
  email: '',
  login: '',
  password: '',
  hash: '',
  code: '',
})

const restoreForm = reactive({
  login: '',
})

const restoreVerifyForm = reactive({
  login: '',
  password: '',
  hash: '',
  code: '',
})

const exportForm = reactive({
  exportType: 0,
  fileName: 'openxart-bookmarks',
})

const exportPending = ref(false)
const exportMessage = ref<string | null>(null)
const exportResponse = ref<RawRecord | null>(null)

const profileFacts = computed(() => {
  const current = toRecord(profile.value)

  return [
    { label: 'Profile ID', value: getNumber(current.id) || 'N/A' },
    { label: 'Login', value: getString(current.login) || 'N/A' },
    { label: 'Status', value: getString(current.status) || 'N/A' },
    { label: 'Token', value: token.value ? 'Stored in cookie' : 'Missing' },
  ]
})

async function submitActiveForm() {
  actionPending.value = true
  actionMessage.value = null
  actionResponse.value = null
  actionTone.value = 'default'

  try {
    let response: ApiCodeResponse

    switch (activeMode.value) {
      case 'signIn':
        response = await session.signIn({
          login: signInForm.login,
          password: signInForm.password,
        })
        break
      case 'signUp':
        response = await session.signUp({
          email: signUpForm.email,
          login: signUpForm.login,
          password: signUpForm.password,
        })
        break
      case 'verify':
        response = await session.verifySignUp({
          email: verifyForm.email,
          login: verifyForm.login,
          password: verifyForm.password,
          hash: verifyForm.hash,
          code: verifyForm.code,
        })
        break
      case 'restore':
        response = await session.restore({
          login: restoreForm.login,
        })
        break
      case 'restoreVerify':
        response = await session.restoreVerify({
          login: restoreVerifyForm.login,
          password: restoreVerifyForm.password,
          hash: restoreVerifyForm.hash,
          code: restoreVerifyForm.code,
        })
        break
    }

    actionResponse.value = response
    actionTone.value = resolveTone(response)
    actionMessage.value = summarizeAuthResponse(activeMode.value, response)
  } catch (error: any) {
    actionTone.value = 'warning'
    actionMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'OpenAnix auth request failed.'
  } finally {
    actionPending.value = false
  }
}

async function runExport() {
  exportPending.value = true
  exportMessage.value = null
  exportResponse.value = null

  try {
    const response = await session.authorizedFetch<ApiCodeResponse>(
      '/api/export/bookmarks',
      {
        method: 'POST',
        body: {
          export_type: exportForm.exportType,
          file_name: exportForm.fileName.trim() || 'openxart-bookmarks',
        },
      },
    )

    exportResponse.value = response
    exportMessage.value =
      getCode(response) === 401
        ? 'Bookmark export is protected by the current OpenAnix session.'
        : 'Bookmark export request completed. Inspect the payload below.'
  } catch (error: any) {
    exportMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Bookmark export request failed.'
  } finally {
    exportPending.value = false
  }
}

function resolveTone(response: ApiCodeResponse) {
  const code = getCode(response)

  if (code === 401 || code === 3 || code === 4) {
    return 'warning'
  }

  return token.value ? 'success' : 'default'
}

function summarizeAuthResponse(mode: AuthMode, response: ApiCodeResponse) {
  const code = getCode(response)

  if (mode === 'signIn' || mode === 'verify' || mode === 'restoreVerify') {
    if (token.value) {
      return `Session token stored. Response code: ${code ?? 'unknown'}.`
    }

    return `OpenAnix returned code ${code ?? 'unknown'} without a session token.`
  }

  if (mode === 'signUp') {
    return `Sign-up response code: ${code ?? 'unknown'}. Use the verify form if you received a hash and code.`
  }

  return `Restore flow response code: ${code ?? 'unknown'}.`
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

function toRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawRecord)
    : {}
}
</script>

<template>
  <div class="space-y-8 pt-8">
    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <article class="stack-shell relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-accent-soft/10 via-transparent to-transparent lg:block" />

        <p class="tone-label">OpenAnix session</p>
        <h1 class="mt-6 max-w-4xl font-display text-5xl leading-[0.9] text-ink sm:text-6xl lg:text-7xl">
          Auth workspace for sign-in, verification and bookmark export.
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          The token is persisted in a cookie and reused by the local Nuxt proxy for
          protected profile, collection and notification endpoints.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink class="ring-link" to="/collections">
            Open collections
          </NuxtLink>
          <NuxtLink class="ring-link" to="/notifications">
            Open notifications
          </NuxtLink>
          <button
            v-if="isAuthenticated"
            class="ring-link"
            type="button"
            @click="session.signOut()"
          >
            Clear session
          </button>
        </div>
      </article>

      <aside class="stack-shell p-6 sm:p-8">
        <SectionHeading
          label="Session"
          title="Current account state"
          description="If the token is valid, the profile payload is loaded through `/api/profile/info`."
        />

        <div class="mt-8 flex items-center gap-4">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
            class="h-16 w-16 rounded-full object-cover"
          >
          <div
            v-else
            class="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white"
          >
            {{ displayName.slice(0, 1) }}
          </div>

          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {{ isAuthenticated ? 'Authenticated' : 'Guest mode' }}
            </p>
            <h2 class="mt-2 text-2xl font-semibold text-ink">
              {{ displayName }}
            </h2>
            <p class="mt-1 text-sm text-muted">
              {{ statusText || 'No profile status returned yet.' }}
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <article
            v-for="fact in profileFacts"
            :key="fact.label"
            class="rounded-[1.5rem] border border-ink/10 bg-white/60 p-4"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {{ fact.label }}
            </p>
            <p class="mt-2 text-sm font-semibold text-ink">
              {{ fact.value }}
            </p>
          </article>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <button
            class="ring-link"
            type="button"
            :disabled="profilePending"
            @click="session.refreshProfile(true)"
          >
            {{ profilePending ? 'Refreshing...' : 'Refresh profile' }}
          </button>
          <p class="text-sm text-muted">
            {{ session.profileError || 'Session state is ready for protected endpoints.' }}
          </p>
        </div>
      </aside>
    </section>

    <section class="stack-shell p-6 sm:p-8">
      <SectionHeading
        label="Auth flows"
        title="Endpoint workbench"
        description="All documented auth flows are available here and point to the local Nuxt proxy routes."
      />

      <div class="mt-8 flex flex-wrap gap-2">
        <button
          v-for="mode in authModes"
          :key="mode.value"
          type="button"
          class="rounded-full border px-4 py-2 text-sm font-medium transition duration-200"
          :class="
            activeMode === mode.value
              ? 'border-accent bg-accent text-white'
              : 'border-ink/10 bg-white/70 text-ink hover:border-ink/20 hover:bg-white'
          "
          @click="activeMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>

      <form class="mt-8 grid gap-4 lg:grid-cols-2" @submit.prevent="submitActiveForm()">
        <template v-if="activeMode === 'signIn'">
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Login</span>
            <input
              v-model="signInForm.login"
              type="text"
              class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
            >
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Password</span>
            <input
              v-model="signInForm.password"
              type="password"
              class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
            >
          </label>
        </template>

        <template v-else-if="activeMode === 'signUp'">
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Email</span>
            <input
              v-model="signUpForm.email"
              type="email"
              class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
            >
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Login</span>
            <input
              v-model="signUpForm.login"
              type="text"
              class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
            >
          </label>
          <label class="space-y-2 lg:col-span-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Password</span>
            <input
              v-model="signUpForm.password"
              type="password"
              class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
            >
          </label>
        </template>

        <template v-else-if="activeMode === 'verify'">
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Email</span>
            <input v-model="verifyForm.email" type="email" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Login</span>
            <input v-model="verifyForm.login" type="text" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Password</span>
            <input v-model="verifyForm.password" type="password" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Hash</span>
            <input v-model="verifyForm.hash" type="text" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
          <label class="space-y-2 lg:col-span-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Code</span>
            <input v-model="verifyForm.code" type="text" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
        </template>

        <template v-else-if="activeMode === 'restore'">
          <label class="space-y-2 lg:col-span-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Login or email</span>
            <input
              v-model="restoreForm.login"
              type="text"
              class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
            >
          </label>
        </template>

        <template v-else>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Login</span>
            <input v-model="restoreVerifyForm.login" type="text" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Password</span>
            <input v-model="restoreVerifyForm.password" type="password" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Hash</span>
            <input v-model="restoreVerifyForm.hash" type="text" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Code</span>
            <input v-model="restoreVerifyForm.code" type="text" class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10">
          </label>
        </template>

        <div class="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button class="ring-link" type="submit" :disabled="actionPending">
            {{ actionPending ? 'Submitting...' : 'Submit request' }}
          </button>
          <p
            v-if="actionMessage"
            class="text-sm"
            :class="actionTone === 'warning' ? 'text-rose-700' : actionTone === 'success' ? 'text-emerald-700' : 'text-muted'"
          >
            {{ actionMessage }}
          </p>
        </div>
      </form>

      <pre
        v-if="actionResponse"
        class="mt-6 overflow-x-auto rounded-[1.75rem] border border-ink/10 bg-white/60 p-4 text-xs leading-6 text-ink"
      >{{ JSON.stringify(actionResponse, null, 2) }}</pre>
    </section>

    <section class="stack-shell p-6 sm:p-8">
      <SectionHeading
        label="Bookmarks"
        title="Export utility"
        description="This uses `/api/export/bookmarks` through the same token-aware proxy layer."
      />

      <div
        v-if="!isAuthenticated"
        class="mt-8 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/55 p-6 text-sm leading-6 text-muted"
      >
        Bookmark export is available after a valid OpenAnix sign-in.
      </div>

      <form
        v-else
        class="mt-8 grid gap-4 lg:grid-cols-[0.24fr_0.76fr]"
        @submit.prevent="runExport()"
      >
        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Export type</span>
          <input
            v-model.number="exportForm.exportType"
            type="number"
            min="0"
            class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
          >
        </label>
        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">File name</span>
          <input
            v-model="exportForm.fileName"
            type="text"
            class="w-full rounded-[1.25rem] border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
          >
        </label>

        <div class="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button class="ring-link" type="submit" :disabled="exportPending">
            {{ exportPending ? 'Exporting...' : 'Export bookmarks' }}
          </button>
          <p v-if="exportMessage" class="text-sm text-muted">
            {{ exportMessage }}
          </p>
        </div>
      </form>

      <pre
        v-if="exportResponse"
        class="mt-6 overflow-x-auto rounded-[1.75rem] border border-ink/10 bg-white/60 p-4 text-xs leading-6 text-ink"
      >{{ JSON.stringify(exportResponse, null, 2) }}</pre>
    </section>
  </div>
</template>
