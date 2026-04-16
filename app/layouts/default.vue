<template>
  <div class="relative min-h-screen">
    <AppHeader />

    <main class="relative z-10">
      <div class="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>

    <footer class="relative z-10">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div class="space-y-1">
          <p>OpenXart / Nuxt 4 / Vue Composition API / Tailwind / UnoCSS</p>
          <p>API proxy: OpenAnix community spec and live server endpoints.</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            class="ring-link"
            href="https://openanix.ru/anixart-api-docs/"
            target="_blank"
            rel="noreferrer"
          >
            OpenAnix docs
          </a>
          <a
            class="ring-link"
            href="https://openanix.ru/anixart-api-docs/openapi.yaml"
            target="_blank"
            rel="noreferrer"
          >
            OpenAPI
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
