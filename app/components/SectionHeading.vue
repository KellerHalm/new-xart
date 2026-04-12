<script setup lang="ts">
defineProps<{
  label: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="max-w-2xl">
      <p class="tone-label">{{ label }}</p>
      <h2 class="mt-4 font-display text-4xl leading-none text-ink sm:text-5xl">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-3 text-sm leading-6 text-muted sm:text-base">
        {{ description }}
      </p>
    </div>

    <slot />
  </div>
</template>
