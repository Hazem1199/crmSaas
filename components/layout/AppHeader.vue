<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
    <!-- Toggle Sidebar -->
    <button
      class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      @click="$emit('toggle-sidebar')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Page Title -->
    <h2 class="text-base font-semibold text-gray-800 hidden md:block">
      {{ pageTitle }}
    </h2>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Workspace Switcher (future) -->
    <div class="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      {{ workspace?.name }}
    </div>

    <!-- Notifications (placeholder) -->
    <button class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </button>

    <!-- User Avatar -->
    <img
      :src="authStore.profile?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.profile?.full_name ?? 'U')}&background=0ea5e9&color=fff`"
      class="w-8 h-8 rounded-full object-cover border-2 border-primary-200 cursor-pointer"
      :alt="authStore.profile?.full_name ?? ''"
    />
  </header>
</template>

<script setup lang="ts">
defineEmits<{ 'toggle-sidebar': [] }>()

const route = useRoute()
const { workspace } = useWorkspace()
const authStore = useAuthStore()

const pageTitleMap: Record<string, string> = {
  dashboard:  'لوحة التحكم',
  leads:      'العملاء المحتملون',
  reports:    'التقارير',
  invoices:   'الفواتير',
  settings:   'الإعدادات',
}

const pageTitle = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  return pageTitleMap[last] ?? ''
})
</script>
