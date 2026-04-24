import type { ApiCodeResponse, AuthProfile, RawRecord } from '~~/shared/types/anix'

interface AuthPayload {
  login: string
  password: string
}

interface SignUpPayload extends AuthPayload {
  email: string
}

interface VerifyPayload extends SignUpPayload {
  hash: string
  code: string
}

interface RestorePayload {
  login: string
}

interface RestoreVerifyPayload extends AuthPayload {
  login: string
  hash: string
  code: string
}

interface AuthorizedFetchOptions<T> {
  method?: 'GET' | 'POST'
  body?: T
  query?: Record<string, string | number | boolean | undefined>
}

export function useAnixSession() {
  const token = useCookie<string | null>('anix_token', {
    default: () => null,
    sameSite: 'lax',
  })
  const profile = useState<AuthProfile | null>('anix-session-profile', () => null)
  const profilePending = useState('anix-session-profile-pending', () => false)
  const profileReady = useState('anix-session-profile-ready', () => false)
  const profileError = useState<string | null>('anix-session-profile-error', () => null)

  const isAuthenticated = computed(() => Boolean(token.value))
  const profileId = computed(() => getNumber(profile.value?.id))
  const displayName = computed(() => getString(profile.value?.login) || 'Account')
  const avatarUrl = computed(() => getString(profile.value?.avatar) || null)
  const statusText = computed(() => getString(profile.value?.status) || null)

  async function authorizedFetch<T = ApiCodeResponse, TBody = unknown>(
    path: string,
    options: AuthorizedFetchOptions<TBody> = {},
  ) {
    const query = {
      ...options.query,
      token: token.value || undefined,
    }

    return await $fetch<T>(path, {
      method: options.method || 'GET',
      body: options.body,
      query,
      headers: token.value
        ? {
            Authorization: `Bearer ${token.value}`,
          }
        : undefined,
    })
  }

  async function refreshProfile(force = false) {
    if (!token.value) {
      clearSession()
      profileReady.value = true
      return null
    }

    if (profilePending.value && !force) {
      return profile.value
    }

    profilePending.value = true
    profileError.value = null

    try {
      const response = await authorizedFetch<ApiCodeResponse>('/api/profile/info')
      const nextProfile = toRecord(response.profile) as AuthProfile

      if (getCode(response) === 401 || !Object.keys(nextProfile).length) {
        clearSession()
        profileError.value = 'OpenAnix rejected the current session token.'
        return null
      }

      profile.value = nextProfile
      return nextProfile
    } catch (error: any) {
      profileError.value =
        error?.data?.statusMessage ||
        error?.message ||
        'Failed to refresh the active profile.'
      return null
    } finally {
      profilePending.value = false
      profileReady.value = true
    }
  }

  async function ensureProfileLoaded() {
    if (!token.value) {
      clearSession()
      profileReady.value = true
      return null
    }

    if (!profileReady.value || !profile.value) {
      return await refreshProfile()
    }

    return profile.value
  }

  async function signIn(payload: AuthPayload) {
    const response = await $fetch<ApiCodeResponse>('/api/auth/signIn', {
      method: 'POST',
      body: payload,
    })

    adoptToken(response)
    profile.value = toRecord(response.profile) as AuthProfile
    profileReady.value = false
    await ensureProfileLoaded()

    return response
  }

  async function signUp(payload: SignUpPayload) {
    return await $fetch<ApiCodeResponse>('/api/auth/signUp', {
      method: 'POST',
      body: payload,
    })
  }

  async function verifySignUp(payload: VerifyPayload) {
    const response = await $fetch<ApiCodeResponse>('/api/auth/verify', {
      method: 'POST',
      body: payload,
    })

    adoptToken(response)
    profile.value = toRecord(response.profile) as AuthProfile
    profileReady.value = false
    await ensureProfileLoaded()

    return response
  }

  async function restore(payload: RestorePayload) {
    return await $fetch<ApiCodeResponse>('/api/auth/restore', {
      method: 'POST',
      body: payload,
    })
  }

  async function restoreVerify(payload: RestoreVerifyPayload) {
    const response = await $fetch<ApiCodeResponse>('/api/auth/restore/verify', {
      method: 'POST',
      body: payload,
    })

    adoptToken(response)
    profile.value = toRecord(response.profile) as AuthProfile
    profileReady.value = false
    await ensureProfileLoaded()

    return response
  }

  function signOut() {
    clearSession()
    profileReady.value = true
  }

  function clearSession() {
    token.value = null
    profile.value = null
  }

  function adoptToken(response: ApiCodeResponse) {
    const nextToken =
      getString(response.profileToken) ||
      getString(response.token) ||
      getString(response.profile_token)

    if (nextToken) {
      token.value = nextToken
    }
  }

  return {
    token,
    profile,
    profileId,
    displayName,
    avatarUrl,
    statusText,
    isAuthenticated,
    profilePending,
    profileReady,
    profileError,
    authorizedFetch,
    ensureProfileLoaded,
    refreshProfile,
    signIn,
    signUp,
    verifySignUp,
    restore,
    restoreVerify,
    signOut,
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

function toRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawRecord)
    : {}
}
