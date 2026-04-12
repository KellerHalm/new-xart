<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="rgb(var(--accent))" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
