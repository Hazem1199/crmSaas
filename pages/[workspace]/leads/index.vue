<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">العملاء المحتملون</h1>
        <p class="text-sm text-gray-500 mt-0.5">إجمالي {{ total }} عميل</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink :to="`/${workspaceSlug}/leads/trash`">
          <BaseButton variant="secondary" size="sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            السلة
          </BaseButton>
        </NuxtLink>
        <BaseButton size="sm" @click="showCreateModal = true">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          إضافة عميل
        </BaseButton>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="card p-4 mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <select v-model="filters.status_id" class="input-base w-40 text-sm" @change="applyFilters">
          <option value="">كل الحالات</option>
          <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="filters.channel_id" class="input-base w-40 text-sm" @change="applyFilters">
          <option value="">كل القنوات</option>
          <option v-for="c in channels" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="filters.campaign_id" class="input-base w-40 text-sm" @change="applyFilters">
          <option value="">كل الحملات</option>
          <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <button
          v-if="hasActiveFilters"
          class="text-sm text-red-500 hover:text-red-700"
          @click="clearFilters"
        >
          مسح الفلاتر
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <LeadTable
      :leads="leads"
      :loading="loading"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      @search="onSearch"
      @row-click="openLead"
      @page-change="onPageChange"
    >
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="exportExcel">
          تصدير Excel
        </BaseButton>
      </template>

      <template #row-actions="{ row }">
        <button
          v-if="can('delete_lead')"
          class="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          @click="deleteLead(row)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </template>
    </LeadTable>

    <!-- Create Modal -->
    <BaseModal v-model="showCreateModal" title="إضافة عميل جديد" size="lg">
      <LeadForm
        :statuses="statuses"
        :channels="channels"
        :campaigns="campaigns"
        :members="members"
        :loading="formLoading"
        @submit="handleCreate"
        @cancel="showCreateModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Status, Channel, Campaign, WorkspaceMember } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'workspace'],
})

const route = useRoute()
const router = useRouter()
const { can } = usePermissions()
const workspaceSlug = computed(() => route.params.workspace as string)

const supabase = useSupabaseClient()

// Leads state
const { leads, total, loading, page, pageSize, fetchLeads, createLead, softDeleteLead } = useLeads()

// Settings data
const statuses = ref<Status[]>([])
const channels = ref<Channel[]>([])
const campaigns = ref<Campaign[]>([])
const members = ref<WorkspaceMember[]>([])

// UI state
const showCreateModal = ref(false)
const formLoading = ref(false)

// Filters
const filters = reactive({
  status_id: '',
  channel_id: '',
  campaign_id: '',
  search: '',
})

const hasActiveFilters = computed(() =>
  !!(filters.status_id || filters.channel_id || filters.campaign_id || filters.search)
)

const applyFilters = () => {
  page.value = 1
  fetchLeads(filters)
}

const clearFilters = () => {
  filters.status_id = ''
  filters.channel_id = ''
  filters.campaign_id = ''
  filters.search = ''
  applyFilters()
}

const onSearch = (q: string) => {
  filters.search = q
  applyFilters()
}

const onPageChange = (p: number) => {
  page.value = p
  fetchLeads(filters)
}

const openLead = (lead: Lead) => {
  router.push(`/${workspaceSlug.value}/leads/${lead.id}`)
}

const handleCreate = async (data: Partial<Lead>) => {
  formLoading.value = true
  try {
    await createLead(data)
    showCreateModal.value = false
    fetchLeads(filters)
  } finally {
    formLoading.value = false
  }
}

const deleteLead = async (lead: Lead) => {
  if (!confirm(`هل تريد نقل "${lead.full_name}" إلى السلة؟`)) return
  await softDeleteLead(lead.id)
  fetchLeads(filters)
}

const exportExcel = async () => {
  const { utils, writeFileXLSX } = await import('xlsx')
  const data = leads.value.map(l => ({
    'الاسم': l.full_name,
    'البريد': l.email ?? '',
    'الهاتف': l.phone ?? '',
    'الحالة': l.status?.name ?? '',
    'القناة': l.channel?.name ?? '',
    'تاريخ الإضافة': new Date(l.created_at).toLocaleDateString('ar-SA'),
  }))
  const ws = utils.json_to_sheet(data)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Leads')
  writeFileXLSX(wb, 'leads.xlsx')
}

// Load settings
const loadSettings = async () => {
  const [s, c, ca, mem] = await Promise.all([
    $fetch<{ data: Status[] }>(`/api/${workspaceSlug.value}/settings/statuses`),
    $fetch<{ data: Channel[] }>(`/api/${workspaceSlug.value}/settings/channels`),
    $fetch<{ data: Campaign[] }>(`/api/${workspaceSlug.value}/settings/campaigns`),
    $fetch<{ data: WorkspaceMember[] }>(`/api/${workspaceSlug.value}/members`),
  ])
  statuses.value = s.data ?? []
  channels.value = c.data ?? []
  campaigns.value = ca.data ?? []
  members.value = mem.data ?? []
}

onMounted(() => {
  fetchLeads()
  loadSettings()
})
</script>
