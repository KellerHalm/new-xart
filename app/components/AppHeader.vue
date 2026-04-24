<script setup lang="ts">
const route = useRoute()
const session = useAnixSession()

const navLinks = [
  { label: 'Catalog', to: '/' },
  { label: 'Auth', to: '/auth' },
  { label: 'Collections', to: '/collections' },
  { label: 'Notifications', to: '/notifications' },
]

const currentMode = computed(() => {
  if (route.path.startsWith('/watch/')) {
    return 'Watch flow'
  }

  if (route.path.startsWith('/releases/')) {
    return 'Release detail'
  }

  if (route.path.startsWith('/collections/')) {
    return 'Collections workspace'
  }

  if (route.path.startsWith('/notifications')) {
    return 'Notifications center'
  }

  if (route.path.startsWith('/auth')) {
    return 'Auth workspace'
  }

  return 'Catalog surface'
})

onMounted(() => {
  session.ensureProfileLoaded()
})
</script>

<template>
  <header class="relative z-10">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pt-4 sm:px-6 lg:px-8">
      <div class="stack-shell flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="tone-label">Stage 11 / Account console</p>
          <h1 class="mt-3 font-display text-4xl leading-none text-ink sm:text-5xl">
            OpenXart
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Anime catalog, watch client and account workspace built on Nuxt,
            backed by OpenAnix community endpoints through a server-side proxy layer.
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
              {{ currentMode }}
            </span>
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
              Nuxt 4
            </span>
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
              Vue Composition API
            </span>
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
              Tailwind + UnoCSS
            </span>
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
              OpenAnix API
            </span>
            <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
              {{ session.token ? session.displayName : 'Guest session' }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              class="ring-link"
              :to="link.to"
            >
              {{ link.label }}
            </NuxtLink>
            <a
              class="ring-link"
              href="https://openanix.ru/anixart-api-docs/"
              target="_blank"
              rel="noreferrer"
            >
              API docs
            </a>
            <button
              v-if="session.token"
              class="ring-link"
              type="button"
              @click="session.signOut()"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
