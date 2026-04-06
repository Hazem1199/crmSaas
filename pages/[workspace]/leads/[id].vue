<template>
  <div v-if="lead">
    <!-- Back -->
    <NuxtLink :to="`/${workspaceSlug}/leads`" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      العودة للقائمة
    </NuxtLink>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Lead Info -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Header Card -->
        <div class="card p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
                {{ lead.full_name.charAt(0) }}
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900">{{ lead.full_name }}</h1>
                <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span v-if="lead.phone">{{ lead.phone }}</span>
                  <span v-if="lead.email">{{ lead.email }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <LeadStatusBadge :status="lead.status" />
              <BaseButton v-if="can('edit_any_lead') || can('edit_own_lead')" variant="secondary" size="sm" @click="showEditModal = true">
                تعديل
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-4">الملاحظات والتفاعلات</h3>
          <div v-if="lead.notes" class="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-4">
            {{ lead.notes }}
          </div>

          <!-- Add Note -->
          <div class="flex gap-2">
            <textarea
              v-model="newNote"
              rows="2"
              placeholder="أضف ملاحظة..."
              class="input-base flex-1 resize-none text-sm"
            />
            <BaseButton size="sm" :loading="addingNote" @click="addNote">إضافة</BaseButton>
          </div>
        </div>
      </div>

      <!-- Right: Sidebar Details -->
      <div class="space-y-4">
        <div class="card p-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">تفاصيل العميل</h4>
          <dl class="space-y-2.5">
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">القناة</dt>
              <dd class="font-medium">{{ lead.channel?.name ?? '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">الحملة</dt>
              <dd class="font-medium">{{ lead.campaign?.name ?? '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">المسؤول</dt>
              <dd class="font-medium">{{ lead.assigned_agent?.full_name ?? '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">تاريخ الإضافة</dt>
              <dd class="font-medium">{{ formatDate(lead.created_at) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <BaseModal v-model="showEditModal" title="تعديل بيانات العميل" size="lg">
      <LeadForm
        :lead="lead"
        :statuses="statuses"
        :channels="channels"
        :campaigns="campaigns"
        :members="members"
        :loading="editLoading"
        @submit="handleEdit"
        @cancel="showEditModal = false"
      />
    </BaseModal>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="flex items-center justify-center py-20 text-gray-400">
    <svg class="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Status, Channel, Campaign, WorkspaceMember } from '~/types'

definePageMeta({ layout: 'default', middleware: ['auth', 'workspace'] })

const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)
const leadId = computed(() => route.params.id as string)
const { can } = usePermissions()
const { getLead, updateLead } = useLeads()

const lead = ref<Lead | null>(null)
const loading = ref(true)
const showEditModal = ref(false)
const editLoading = ref(false)
const newNote = ref('')
const addingNote = ref(false)

const statuses = ref<Status[]>([])
const channels = ref<Channel[]>([])
const campaigns = ref<Campaign[]>([])
const members = ref<WorkspaceMember[]>([])

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ar-SA', { day: '2-digit', month: 'long', year: 'numeric' })

const handleEdit = async (data: Partial<Lead>) => {
  editLoading.value = true
  try {
    const result = await updateLead(leadId.value, data)
    lead.value = result.data
    showEditModal.value = false
  } finally {
    editLoading.value = false
  }
}

const addNote = async () => {
  if (!newNote.value.trim()) return
  // TODO: implement note API
  newNote.value = ''
}

onMounted(async () => {
  try {
    lead.value = await getLead(leadId.value)
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
  } finally {
    loading.value = false
  }
})
</script>
