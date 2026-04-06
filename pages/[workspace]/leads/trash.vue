<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">السلة</h1>
        <p class="text-sm text-gray-500 mt-0.5">العملاء المحذوفون مؤقتاً</p>
      </div>
      <NuxtLink :to="`/${workspaceSlug}/leads`">
        <BaseButton variant="secondary" size="sm">العودة للقائمة</BaseButton>
      </NuxtLink>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">جاري التحميل...</div>
      <div v-else-if="!items.length" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <p class="text-gray-400 text-sm">السلة فارغة</p>
      </div>
      <table v-else class="min-w-full divide-y divide-gray-100">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500">الاسم</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500">الهاتف</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500">تاريخ الحذف</th>
            <th class="px-4 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.full_name }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ item.phone ?? '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-400">{{ formatDate(item.deleted_at!) }}</td>
            <td class="px-4 py-3">
              <BaseButton variant="ghost" size="sm" :loading="restoringId === item.id" @click="restore(item)">
                استعادة
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Lead } from '~/types'

definePageMeta({ layout: 'default', middleware: ['auth', 'workspace'] })

const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)
const { restoreLead } = useLeads()

const items = ref<Lead[]>([])
const loading = ref(true)
const restoringId = ref<string | null>(null)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric' })

const restore = async (lead: Lead) => {
  restoringId.value = lead.id
  try {
    await restoreLead(lead.id)
    items.value = items.value.filter(i => i.id !== lead.id)
  } finally {
    restoringId.value = null
  }
}

onMounted(async () => {
  try {
    const result = await $fetch<{ data: Lead[] }>(
      `/api/${workspaceSlug.value}/leads/trash`
    )
    items.value = result.data ?? []
  } finally {
    loading.value = false
  }
})
</script>
