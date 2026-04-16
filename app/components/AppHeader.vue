<script setup lang="ts">
const route = useRoute()

const currentMode = computed(() => {
  if (route.path.startsWith('/watch/')) {
    return 'Watch flow'
  }

  if (route.path.startsWith('/releases/')) {
    return 'Release detail'
  }

  return 'Catalog surface'
})
</script>

<template>
  <header class="relative z-10">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pt-4 sm:px-6 lg:px-8">
      <div class="stack-shell flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="tone-label">Stage 5 / Production pass</p>
          <h1 class="mt-3 font-display text-4xl leading-none text-ink sm:text-5xl">
            OpenXart
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Anime catalog and watch client built on Nuxt, backed by OpenAnix
            community endpoints through a server-side proxy layer.
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
          </div>

          <div class="flex flex-wrap gap-2">
            <NuxtLink class="ring-link" to="/">
              Catalog
            </NuxtLink>
            <a
              class="ring-link"
              href="https://openanix.ru/anixart-api-docs/"
              target="_blank"
              rel="noreferrer"
            >
              API docs
            </a>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
