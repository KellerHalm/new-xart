<template>
  <header class="relative z-10">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pt-4 sm:px-6 lg:px-8">
      <div class="stack-shell flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p class="tone-label">Stage 1 · Foundation</p>
          <h1 class="mt-3 font-display text-4xl leading-none text-ink sm:text-5xl">
            OpenXart
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Client shell for anime browsing and watching, backed by OpenAnix
            endpoints through a Nuxt server proxy.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">
          <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
            Nuxt 4
          </span>
          <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
            Tailwind
          </span>
          <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
            UnoCSS
          </span>
          <span class="rounded-full border border-ink/10 bg-white/70 px-3 py-2">
            OpenAnix API
          </span>
        </div>
      </div>
    </div>
  </header>
</template>
