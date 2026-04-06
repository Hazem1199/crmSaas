<template>
  <div>
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="stat in stats" :key="stat.label" class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">
              {{ loading ? '...' : stat.value }}
            </p>
            <p class="text-xs mt-1" :class="stat.change >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ stat.change >= 0 ? '+' : '' }}{{ stat.change }}% هذا الشهر
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="stat.bg">
            <component :is="stat.icon" class="w-6 h-6" :class="stat.iconColor" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Leads -->
    <div class="card">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-900">آخر العملاء المضافين</h3>
        <NuxtLink
          :to="`/${route.params.workspace}/leads`"
          class="text-sm text-primary-600 hover:underline"
        >
          عرض الكل
        </NuxtLink>
      </div>

      <div v-if="recentLoading" class="text-center py-8 text-gray-400 text-sm">جاري التحميل...</div>
      <div v-else-if="!recentLeads.length" class="text-center py-8 text-gray-400 text-sm">لا توجد بيانات</div>
      <div v-else class="divide-y divide-gray-50">
        <div
          v-for="lead in recentLeads"
          :key="lead.id"
          class="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="openLead(lead.id)"
        >
          <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span class="text-sm font-semibold text-primary-700">{{ lead.full_name.charAt(0) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ lead.full_name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ lead.phone ?? lead.email ?? '—' }}</p>
          </div>
          <LeadStatusBadge :status="lead.status" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UsersIcon, ChartBarIcon, DocumentTextIcon, BellIcon } from '@heroicons/vue/24/outline'
import type { Lead } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'workspace'],
})

const route = useRoute()
const { workspace } = useWorkspace()

const loading = ref(true)
const recentLoading = ref(true)
const recentLeads = ref<Lead[]>([])

// إحصائيات وهمية (ستُستبدل بـ API حقيقي)
const stats = ref([
  { label: 'إجمالي العملاء',    value: 0, change: 0,   bg: 'bg-blue-50',   icon: UsersIcon,         iconColor: 'text-blue-600' },
  { label: 'عملاء جدد اليوم',   value: 0, change: 0,   bg: 'bg-green-50',  icon: ChartBarIcon,      iconColor: 'text-green-600' },
  { label: 'في انتظار المتابعة', value: 0, change: 0,   bg: 'bg-yellow-50', icon: BellIcon,          iconColor: 'text-yellow-600' },
  { label: 'إجمالي الفواتير',   value: 0, change: 0,   bg: 'bg-purple-50', icon: DocumentTextIcon,  iconColor: 'text-purple-600' },
])

const openLead = (id: string) => navigateTo(`/${route.params.workspace}/leads/${id}`)

onMounted(async () => {
  if (!route.params.workspace) return

  try {
    const result = await $fetch<{ data: Lead[]; total: number }>(
      `/api/${route.params.workspace}/leads`,
      { query: { from: 0, to: 4 } }
    )
    recentLeads.value = result.data ?? []
    stats.value[0].value = result.total ?? 0
  } finally {
    loading.value = false
    recentLoading.value = false
  }
})
</script>
