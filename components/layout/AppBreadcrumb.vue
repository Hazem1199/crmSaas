<template>
  <nav v-if="crumbs.length > 1" class="flex items-center gap-1 text-sm text-gray-500">
    <template v-for="(crumb, i) in crumbs" :key="crumb.path">
      <span v-if="i > 0" class="text-gray-300">‹</span>
      <NuxtLink
        v-if="i < crumbs.length - 1"
        :to="crumb.path"
        class="hover:text-primary-600 transition-colors"
      >
        {{ crumb.label }}
      </NuxtLink>
      <span v-else class="text-gray-800 font-medium">{{ crumb.label }}</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const breadcrumbMap: Record<string, string> = {
  dashboard:  'لوحة التحكم',
  leads:      'العملاء المحتملون',
  trash:      'السلة',
  reports:    'التقارير',
  invoices:   'الفواتير',
  settings:   'الإعدادات',
  channels:   'قنوات الجلب',
  statuses:   'حالات العميل',
  labels:     'التصنيفات',
  campaigns:  'الحملات الإعلانية',
  team:       'الفريق',
  sms:        'إعدادات SMS',
}

const crumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  let builtPath = ''
  return segments
    .filter(s => !s.match(/^[0-9a-f-]{36}$/i)) // استبعاد UUIDs
    .map(seg => {
      builtPath += `/${seg}`
      return {
        path: builtPath,
        label: breadcrumbMap[seg] ?? seg,
      }
    })
})
</script>
