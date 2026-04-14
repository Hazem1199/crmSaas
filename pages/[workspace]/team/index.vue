<template>
  <div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-gray-900">الأعضاء</h1>
        <p class="text-sm text-gray-500 mt-0.5">أعضاء مساحة العمل والأدوار المعيّنة لهم</p>
      </div>
      <BaseButton
        v-if="can('manage_team')"
        type="button"
        variant="primary"
        class="shrink-0"
        @click="openInviteModal"
      >
        دعوة عضو
      </BaseButton>
    </div>

    <div v-if="loadError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {{ loadError }}
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">جاري التحميل...</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-right font-medium text-gray-700">الاسم</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700">الدور</th>
              <th v-if="can('manage_team')" class="px-4 py-3 text-left font-medium text-gray-700 w-56">تغيير الدور</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="row in members" :key="row.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3 font-medium text-gray-900">
                {{ row.profile?.full_name ?? row.user_id }}
              </td>
              <td class="px-4 py-3 text-gray-700">
                {{ row.workspace_roles?.name ?? '—' }}
              </td>
              <td v-if="can('manage_team')" class="px-4 py-3">
                <select
                  v-if="!row.workspace_roles?.is_owner_role"
                  class="input-base text-sm max-w-xs"
                  :value="row.workspace_role_id"
                  :disabled="savingId === row.id"
                  @change="onRoleSelectChange(row, $event)"
                >
                  <option v-for="r in assignableRoles" :key="r.id" :value="r.id">
                    {{ r.name }}
                  </option>
                </select>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="can('manage_team')" class="mt-10">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">الدعوات</h2>
      <p class="text-sm text-gray-500 mb-4">آخر الدعوات المرسلة لهذه المساحة</p>

      <div class="card overflow-hidden">
        <div v-if="invitesLoading" class="text-center py-8 text-gray-400 text-sm">جاري التحميل...</div>
        <div v-else-if="!invitations.length" class="px-4 py-8 text-center text-sm text-gray-500">
          لا توجد دعوات بعد
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-right font-medium text-gray-700">البريد</th>
                <th class="px-4 py-3 text-right font-medium text-gray-700">الدور</th>
                <th class="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                <th class="px-4 py-3 text-right font-medium text-gray-700">تاريخ الإرسال</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-for="inv in invitations" :key="inv.id" class="hover:bg-gray-50/80">
                <td class="px-4 py-3 font-mono text-xs text-gray-900">{{ inv.invitee_email }}</td>
                <td class="px-4 py-3 text-gray-700">{{ inv.role?.name ?? '—' }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="inviteStatusClass(inv.status)"
                  >
                    {{ inviteStatusLabel(inv.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-600 text-xs">{{ formatDate(inv.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <BaseModal v-model="inviteOpen" title="دعوة عضو" size="md" @update:model-value="onInviteModalClose">
      <form class="space-y-4" @submit.prevent="submitInvite">
        <BaseInput
          v-model="inviteEmail"
          label="البريد الإلكتروني"
          type="email"
          placeholder="colleague@company.com"
          required
          :error="inviteFieldErrors.email"
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">الدور</label>
          <select v-model="inviteRoleId" class="input-base w-full text-sm" required>
            <option v-for="r in assignableRoles" :key="r.id" :value="r.id">
              {{ r.name }}{{ r.is_default_invite_role ? ' (افتراضي)' : '' }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500">يُستخدَم الدور الافتراضي للدعوات من إعدادات المساحة عند عدم الاختيار.</p>
        </div>
        <div
          v-if="inviteError"
          class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {{ inviteError }}
        </div>
        <div
          v-if="inviteSuccess"
          class="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
        >
          {{ inviteSuccess }}
        </div>
        <div v-if="pendingInviteLink" class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
          <p class="text-gray-600 mb-2">رابط الدعوة (انسخه وأرسله للمدعو):</p>
          <p class="font-mono break-all text-gray-900 mb-2">{{ pendingInviteLink }}</p>
          <button
            type="button"
            class="text-sm text-primary-600 font-medium hover:underline"
            @click="copyInviteLink"
          >
            نسخ الرابط
          </button>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            @click="inviteOpen = false"
          >
            إلغاء
          </button>
          <BaseButton type="submit" :loading="inviteSubmitting">
            إرسال الدعوة
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceInvitationRow, WorkspaceMember, WorkspaceRole } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'workspace'],
})

const route = useRoute()
const { can } = usePermissions()
const workspaceSlug = computed(() => route.params.workspace as string)

const members = ref<(WorkspaceMember & { workspace_roles?: { id: string; name: string; slug: string; is_owner_role: boolean } })[]>([])
const assignableRoles = ref<WorkspaceRole[]>([])
const invitations = ref<WorkspaceInvitationRow[]>([])
const loading = ref(true)
const invitesLoading = ref(false)
const loadError = ref('')
const savingId = ref<string | null>(null)

const inviteOpen = ref(false)
const inviteEmail = ref('')
const inviteRoleId = ref('')
const inviteFieldErrors = reactive({ email: '' })
const inviteError = ref('')
const inviteSuccess = ref('')
const inviteSubmitting = ref(false)
const pendingInviteLink = ref('')

function inviteStatusLabel(s: WorkspaceInvitationRow['status']) {
  const map: Record<string, string> = {
    pending: 'معلّقة',
    accepted: 'مقبولة',
    expired: 'منتهية',
    cancelled: 'ملغاة',
  }
  return map[s] ?? s
}

function inviteStatusClass(s: WorkspaceInvitationRow['status']) {
  if (s === 'pending') return 'bg-amber-100 text-amber-900'
  if (s === 'accepted') return 'bg-green-100 text-green-800'
  if (s === 'expired') return 'bg-gray-100 text-gray-700'
  return 'bg-red-50 text-red-800'
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
  }
  catch {
    return iso
  }
}

async function load() {
  loadError.value = ''
  try {
    const [memRes, rolesRes] = await Promise.all([
      $fetch<{ data: typeof members.value }>(`/api/${workspaceSlug.value}/members`),
      $fetch<{ data: WorkspaceRole[] }>(`/api/${workspaceSlug.value}/roles`),
    ])
    members.value = memRes.data ?? []
    assignableRoles.value = (rolesRes.data ?? []).filter((r) => !r.is_owner_role)
    if (assignableRoles.value.length && !inviteRoleId.value) {
      const def = assignableRoles.value.find((r) => r.is_default_invite_role)
      inviteRoleId.value = (def ?? assignableRoles.value[0]).id
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    loadError.value = err?.data?.message ?? err?.message ?? 'تعذر التحميل'
    members.value = []
  }
}

async function loadInvitations() {
  if (!can('manage_team')) return
  invitesLoading.value = true
  try {
    const res = await $fetch<{ data: WorkspaceInvitationRow[] }>(
      `/api/${workspaceSlug.value}/invitations`,
    )
    invitations.value = res.data ?? []
  }
  catch {
    invitations.value = []
  }
  finally {
    invitesLoading.value = false
  }
}

function onRoleSelectChange(row: (typeof members.value)[0], ev: Event) {
  const el = ev.target as HTMLSelectElement
  void onRoleChange(row, el.value)
}

async function onRoleChange(row: (typeof members.value)[0], workspace_role_id: string) {
  if (workspace_role_id === row.workspace_role_id) return
  savingId.value = row.id
  try {
    await $fetch(`/api/${workspaceSlug.value}/members/${row.id}`, {
      method: 'PATCH',
      body: { workspace_role_id },
    })
    await load()
  }
  catch {
    alert('تعذر حفظ الدور')
  }
  finally {
    savingId.value = null
  }
}

function copyInviteLink() {
  if (!pendingInviteLink.value || !navigator.clipboard?.writeText) return
  void navigator.clipboard.writeText(pendingInviteLink.value)
}

function openInviteModal() {
  inviteEmail.value = ''
  inviteFieldErrors.email = ''
  inviteError.value = ''
  inviteSuccess.value = ''
  pendingInviteLink.value = ''
  const def = assignableRoles.value.find((r) => r.is_default_invite_role)
  inviteRoleId.value = (def ?? assignableRoles.value[0])?.id ?? ''
  inviteOpen.value = true
}

function onInviteModalClose(open: boolean) {
  if (!open) {
    inviteError.value = ''
    inviteSuccess.value = ''
    pendingInviteLink.value = ''
  }
}

async function submitInvite() {
  inviteFieldErrors.email = ''
  inviteError.value = ''
  inviteSuccess.value = ''
  pendingInviteLink.value = ''

  const email = inviteEmail.value.trim()
  if (!email) {
    inviteFieldErrors.email = 'البريد مطلوب'
    return
  }

  inviteSubmitting.value = true
  try {
    const res = await $fetch<{
      mode: string
      email_sent?: boolean
      invite_link?: string
      hint?: string
    }>(`/api/${workspaceSlug.value}/members/invite`, {
      method: 'POST',
      body: {
        email,
        workspace_role_id: inviteRoleId.value,
      },
    })
    if (res.email_sent) {
      inviteSuccess.value = 'تم إرسال الدعوة إلى البريد.'
    }
    else if (res.invite_link) {
      inviteSuccess.value =
        res.hint
        ?? 'تم إنشاء الدعوة. انسخ الرابط أدناه وأرسله للمدعو يدوياً (أو اضبط RESEND_API_KEY و EMAIL_FROM).'
      pendingInviteLink.value = res.invite_link
    }
    else {
      inviteSuccess.value = 'تم إنشاء الدعوة.'
    }
    await Promise.all([load(), loadInvitations()])
    if (!pendingInviteLink.value) {
      setTimeout(() => {
        inviteOpen.value = false
      }, 1200)
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    inviteError.value = err?.data?.message ?? err?.message ?? 'تعذر إرسال الدعوة'
  }
  finally {
    inviteSubmitting.value = false
  }
}

onMounted(async () => {
  await load()
  await loadInvitations()
  loading.value = false
})
</script>
