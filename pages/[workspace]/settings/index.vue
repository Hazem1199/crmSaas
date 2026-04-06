<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-900">الإعدادات</h1>
    </div>

    <!-- Settings Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        :class="activeTab === tab.key
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth', 'workspace'] })

const route = useRoute()
const router = useRouter()
const workspaceSlug = computed(() => route.params.workspace as string)

const tabs = [
  { key: 'channels',  label: 'قنوات الجلب' },
  { key: 'statuses',  label: 'الحالات' },
]

const activeTab = ref('channels')

watch(activeTab, (tab) => {
  router.push(`/${workspaceSlug.value}/settings/${tab}`)
})

onMounted(() => {
  const seg = route.path.split('/').at(-1)
  if (tabs.find(t => t.key === seg)) activeTab.value = seg!
  else router.push(`/${workspaceSlug.value}/settings/channels`)
})
</script>
