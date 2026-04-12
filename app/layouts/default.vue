<template>
  <div class="relative min-h-screen">
    <AppHeader />

    <main class="relative z-10">
      <div class="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>

    <footer class="relative z-10">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6 lg:px-8">
        <p>OpenXart · Nuxt 4 + Vue Composition API + Tailwind + UnoCSS</p>
        <p>API proxy: OpenAnix community spec</p>
      </div>
    </footer>
  </div>
</template>
