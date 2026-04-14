<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">الحملات الإعلانية</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          حملات الشركة للفترة القادمة، مع صفحة الجمع وسكريبت خدمة العملاء وموظفي المبيعات
        </p>
      </div>
      <div v-if="can('manage_campaigns')" class="flex flex-wrap items-center gap-2 shrink-0">
        <BaseButton
          variant="secondary"
          size="sm"
          class="label-picker-trigger !shadow-sm border border-gray-200"
          @click="openLabelPicker(null, $event)"
        >
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          ربط التصنيفات
        </BaseButton>
        <BaseButton size="sm" @click="openModal()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          إضافة حملة
        </BaseButton>
      </div>
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
              <th class="px-4 py-3 text-right font-medium text-gray-700 w-24">عدد العملاء</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 min-w-[11rem]">التصنيفات</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700">موظفو المبيعات</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
              <th v-if="can('manage_campaigns')" class="px-4 py-3 text-left font-medium text-gray-700 w-40">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="row in campaigns" :key="row.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3 font-medium text-gray-900">{{ row.name }}</td>
              <td class="px-4 py-3 text-gray-800 tabular-nums font-medium">
                {{ row.lead_count ?? 0 }}
              </td>
              <td class="px-4 py-3 align-top">
                <div class="flex flex-wrap items-center gap-1.5">
                  <template v-for="p in row.labels_preview ?? []" :key="p.id">
                    <span
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800 shadow-sm"
                    >
                      <span
                        class="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5"
                        :style="{ backgroundColor: p.color }"
                      />
                      {{ p.name }}
                    </span>
                  </template>
                  <span
                    v-if="(row.label_count ?? 0) > 3"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold text-gray-500 bg-gray-100 tabular-nums"
                  >
                    +{{ (row.label_count ?? 0) - 3 }}
                  </span>
                  <button
                    v-if="can('manage_campaigns')"
                    type="button"
                    class="label-picker-trigger inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-700 transition-colors"
                    :title="'تعديل تصنيفات ' + row.name"
                    @click="openLabelPicker(row.id, $event)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    v-else
                    type="button"
                    class="text-xs text-primary-600 hover:text-primary-800 font-medium px-1"
                    @click="openLabelPicker(row.id, $event)"
                  >
                    عرض
                  </button>
                </div>
                <p
                  v-if="!(row.labels_preview?.length) && !(row.label_count)"
                  class="text-xs text-gray-400 mt-1"
                >
                  —
                </p>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ assignmentNames(row) }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                  :class="row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                >
                  {{ row.is_active ? 'نشطة' : 'متوقفة' }}
                </span>
              </td>
              <td v-if="can('manage_campaigns')" class="px-4 py-3">
                <div class="flex flex-wrap items-center gap-2 justify-end">
                  <BaseButton variant="secondary" size="sm" @click="openModal(row)">تعديل</BaseButton>
                  <BaseButton variant="danger" size="sm" @click="remove(row)">حذف</BaseButton>
                </div>
              </td>
            </tr>
            <tr v-if="!campaigns.length">
              <td :colspan="can('manage_campaigns') ? 6 : 5" class="px-4 py-10 text-center text-gray-400">
                لا توجد حملات بعد
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal v-model="modalOpen" :title="editingId ? 'تعديل حملة' : 'إضافة حملة'" size="lg">
      <form class="space-y-4" @submit.prevent="save">
        <BaseInput v-model="form.name" label="اسم الحملة" required />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
          <textarea v-model="form.description" rows="2" class="input-base resize-none" placeholder="اختياري" />
        </div>
        <BaseInput
          v-model="form.landing_page_url"
          label="رابط صفحة جمع البيانات"
          type="url"
          placeholder="https://..."
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">سكريبت خدمة العملاء</label>
          <textarea
            v-model="form.customer_service_script"
            rows="4"
            class="input-base resize-none font-mono text-xs"
            placeholder="نص التوجيهات للفريق..."
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="form.starts_at" label="بداية الحملة" type="date" />
          <BaseInput v-model="form.ends_at" label="نهاية الحملة" type="date" />
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300" />
          حملة نشطة
        </label>
        <div>
          <p class="block text-sm font-medium text-gray-700 mb-2">موظفو المبيعات المعيَّنون</p>
          <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
            <label
              v-for="m in members"
              :key="m.user_id"
              class="flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
            >
              <input
                v-model="form.assigned_user_ids"
                type="checkbox"
                class="rounded border-gray-300"
                :value="m.user_id"
              />
              {{ m.profile?.full_name ?? m.user_id }}
            </label>
            <p v-if="!members.length" class="text-xs text-gray-400">لا يوجد أعضاء في المساحة</p>
          </div>
        </div>
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="secondary" type="button" @click="modalOpen = false">إلغاء</BaseButton>
          <BaseButton type="submit" :loading="saving">حفظ</BaseButton>
        </div>
      </form>
    </BaseModal>

    <Teleport to="body">
      <div
        v-if="labelPopOpen"
        ref="labelPopPanelRef"
        class="label-popover-panel fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5"
        :style="labelPopStyle"
      >
        <div class="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-l from-gray-50 to-white px-4 py-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">تصنيفات الحملات</h3>
            <p class="text-xs text-gray-500 mt-0.5">اختر الحملة ثم فعّل التصنيفات مع الألوان المحفوظة</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="إغلاق"
            @click="closeLabelPicker"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="showCampaignSelect">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">الحملة</label>
            <select
              v-model="pickerCampaignId"
              class="input-base w-full text-sm"
              @change="onPickerCampaignChange"
            >
              <option v-for="c in campaigns" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <p class="text-xs text-gray-500 leading-relaxed">
            التصنيفات على مستوى المساحة؛ يمكن ربط نفس التصنيف بعدة حملات. لا تُخزَّن على بطاقة العميل.
          </p>

          <div v-if="labelsLoading" class="text-center py-8 text-gray-400 text-sm">جاري التحميل...</div>

          <template v-else-if="!can('manage_campaigns')">
            <p class="text-sm font-medium text-gray-700 mb-2">مربوطة بهذه الحملة</p>
            <ul v-if="campaignLabels.length" class="flex flex-wrap gap-2">
              <li
                v-for="lb in campaignLabels"
                :key="lb.id"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
              >
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ backgroundColor: lb.color || '#6B7280' }"
                />
                {{ lb.name }}
              </li>
            </ul>
            <p v-else class="text-sm text-gray-400">لا توجد تصنيفات مربوطة</p>
          </template>

          <template v-else>
            <BaseInput
              v-model="labelSearch"
              label="بحث في التصنيفات"
              placeholder="اكتب للتصفية..."
            />

            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">
                ربط بالحملة: {{ labelsTarget?.name ?? '—' }}
              </p>
              <div class="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                <label
                  v-for="lb in filteredWorkspaceLabels"
                  :key="lb.id"
                  class="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    class="rounded border-gray-300 shrink-0"
                    :checked="selectedLabelIds.includes(lb.id)"
                    @change="onLabelCheckChange($event, lb.id)"
                  />
                  <span
                    class="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-gray-200"
                    :style="{ backgroundColor: lb.color || '#6B7280' }"
                  />
                  <span class="font-medium text-gray-900 truncate flex-1">{{ lb.name }}</span>
                  <span class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      class="text-xs px-2 py-0.5 rounded text-primary-600 hover:bg-primary-50"
                      @click.prevent="startEditWorkspaceLabel(lb)"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      class="text-xs px-2 py-0.5 rounded text-red-600 hover:bg-red-50"
                      @click.prevent="deleteWorkspaceLabel(lb)"
                    >
                      حذف
                    </button>
                  </span>
                </label>
                <p v-if="!filteredWorkspaceLabels.length" class="px-3 py-6 text-center text-gray-400 text-sm">
                  {{ workspaceAllLabels.length ? 'لا يوجد تطابق للبحث' : 'لا توجد تصنيفات — أضف واحداً بالأسفل' }}
                </p>
              </div>
              <p v-if="labelsLinkError" class="text-sm text-red-600 mt-2">{{ labelsLinkError }}</p>
              <div class="mt-3 flex justify-end">
                <BaseButton size="sm" :loading="labelsLinkSaving" @click="saveCampaignLabelLinks">
                  حفظ ربط الحملة
                </BaseButton>
              </div>
            </div>

            <div class="border-t border-gray-100 pt-4 space-y-3">
              <p class="text-sm font-medium text-gray-700">
                {{ editingWorkspaceLabelId ? 'تعديل تصنيف في المساحة' : 'تصنيف جديد في المساحة' }}
              </p>
              <form class="space-y-3" @submit.prevent="submitWorkspaceLabel">
                <BaseInput
                  v-model="labelForm.name"
                  label="اسم التصنيف"
                  placeholder="مثال: 2026"
                  required
                />
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">لون العرض</label>
                  <input
                    v-model="labelForm.color"
                    type="color"
                    class="h-9 w-full max-w-[8rem] rounded border border-gray-300 cursor-pointer"
                  />
                </div>
                <p v-if="labelFormError" class="text-sm text-red-600">{{ labelFormError }}</p>
                <div class="flex flex-wrap gap-2">
                  <BaseButton type="submit" size="sm" :loading="labelSaving">
                    {{ editingWorkspaceLabelId ? 'حفظ التعديل' : 'إضافة للمساحة' }}
                  </BaseButton>
                  <BaseButton
                    v-if="editingWorkspaceLabelId"
                    variant="secondary"
                    size="sm"
                    type="button"
                    @click="cancelWorkspaceLabelEdit"
                  >
                    إلغاء
                  </BaseButton>
                </div>
              </form>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Campaign, Label, WorkspaceMember } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'workspace'],
})

const route = useRoute()
const { can } = usePermissions()
const workspaceSlug = computed(() => route.params.workspace as string)

const campaigns = ref<Campaign[]>([])
const loadError = ref('')
const members = ref<WorkspaceMember[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')

const form = reactive({
  name: '',
  description: '',
  landing_page_url: '',
  customer_service_script: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
  assigned_user_ids: [] as string[],
})

const labelPopOpen = ref(false)
const showCampaignSelect = ref(false)
const labelPopPanelRef = ref<HTMLElement | null>(null)
const labelPopAnchorEl = ref<HTMLElement | null>(null)
const labelPopStyle = ref<Record<string, string>>({
  top: '80px',
  left: '16px',
  width: '400px',
  maxHeight: 'min(560px, calc(100vh - 96px))',
})

const pickerCampaignId = ref('')
const campaignLabels = ref<Label[]>([])
const workspaceAllLabels = ref<Label[]>([])
const selectedLabelIds = ref<string[]>([])
const labelSearch = ref('')
const labelsLoading = ref(false)
const labelsLinkSaving = ref(false)
const labelsLinkError = ref('')
const labelForm = reactive({ name: '', color: '#6B7280' })
const editingWorkspaceLabelId = ref<string | null>(null)
const labelFormError = ref('')
const labelSaving = ref(false)

const labelsTarget = computed(() => {
  if (!pickerCampaignId.value) return null
  return campaigns.value.find((c) => c.id === pickerCampaignId.value) ?? null
})

const filteredWorkspaceLabels = computed(() => {
  const q = labelSearch.value.trim().toLowerCase()
  const list = workspaceAllLabels.value
  if (!q) return list
  return list.filter((l) => l.name.toLowerCase().includes(q))
})

function assignmentNames(row: Campaign): string {
  const list = row.assignments ?? []
  if (!list.length) return '—'
  return list.map((a) => a.profile?.full_name ?? a.user_id).join('، ')
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function applyPopoverPosition() {
  if (typeof window === 'undefined') return
  const margin = 12
  const panelW = Math.min(420, window.innerWidth - 2 * margin)
  const maxH = Math.min(560, window.innerHeight - 96)
  const el = labelPopAnchorEl.value
  if (!el) {
    labelPopStyle.value = {
      top: `${margin + 56}px`,
      left: `${margin}px`,
      width: `${panelW}px`,
      maxHeight: `${maxH}px`,
    }
    return
  }
  const rect = el.getBoundingClientRect()
  const gap = 8
  let top = rect.bottom + gap
  let left = rect.left
  left = Math.max(margin, Math.min(left, window.innerWidth - panelW - margin))
  if (top + maxH > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - gap - Math.min(maxH, rect.top - margin))
  }
  labelPopStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${panelW}px`,
    maxHeight: `${maxH}px`,
  }
}

function onGlobalPointerDown(e: PointerEvent) {
  if (!labelPopOpen.value) return
  const t = e.target as HTMLElement
  if (t.closest('.label-popover-panel')) return
  if (t.closest('.label-picker-trigger')) return
  closeLabelPicker()
}

function onWindowResize() {
  if (labelPopOpen.value) applyPopoverPosition()
}

function closeLabelPicker() {
  labelPopOpen.value = false
  showCampaignSelect.value = false
}

function openModal(row?: Campaign) {
  formError.value = ''
  editingId.value = row?.id ?? null
  if (row) {
    form.name = row.name
    form.description = row.description ?? ''
    form.landing_page_url = row.landing_page_url ?? ''
    form.customer_service_script = row.customer_service_script ?? ''
    form.starts_at = toDateInput(row.starts_at)
    form.ends_at = toDateInput(row.ends_at)
    form.is_active = row.is_active
    form.assigned_user_ids = (row.assignments ?? []).map((a) => a.user_id)
  }
  else {
    form.name = ''
    form.description = ''
    form.landing_page_url = ''
    form.customer_service_script = ''
    form.starts_at = ''
    form.ends_at = ''
    form.is_active = true
    form.assigned_user_ids = []
  }
  modalOpen.value = true
}

async function load() {
  loadError.value = ''
  try {
    const [c, m] = await Promise.all([
      $fetch<{ data: Campaign[] }>(`/api/${workspaceSlug.value}/campaigns`),
      $fetch<{ data: WorkspaceMember[] }>(`/api/${workspaceSlug.value}/members`),
    ])
    campaigns.value = c.data ?? []
    members.value = m.data ?? []
    if (labelPopOpen.value && pickerCampaignId.value) {
      const still = campaigns.value.some((x) => x.id === pickerCampaignId.value)
      if (!still) closeLabelPicker()
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    loadError.value = err?.data?.message ?? err?.message ?? 'تعذر تحميل الحملات'
    campaigns.value = []
    members.value = []
  }
}

async function save() {
  if (!form.name.trim()) {
    formError.value = 'اسم الحملة مطلوب'
    return
  }
  formError.value = ''
  saving.value = true
  try {
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      landing_page_url: form.landing_page_url.trim() || null,
      customer_service_script: form.customer_service_script.trim() || null,
      starts_at: form.starts_at ? `${form.starts_at}T00:00:00.000Z` : null,
      ends_at: form.ends_at ? `${form.ends_at}T23:59:59.999Z` : null,
      is_active: form.is_active,
      assigned_user_ids: [...form.assigned_user_ids],
    }
    if (editingId.value) {
      await $fetch(`/api/${workspaceSlug.value}/campaigns/${editingId.value}`, {
        method: 'PUT',
        body,
      })
    }
    else {
      await $fetch(`/api/${workspaceSlug.value}/campaigns`, {
        method: 'POST',
        body,
      })
    }
    modalOpen.value = false
    await load()
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    formError.value = err?.data?.message ?? err?.message ?? 'فشل الحفظ'
  }
  finally {
    saving.value = false
  }
}

async function remove(row: Campaign) {
  if (!confirm(`حذف الحملة «${row.name}»؟`)) return
  try {
    await $fetch(`/api/${workspaceSlug.value}/campaigns/${row.id}`, { method: 'DELETE' })
    await load()
  }
  catch {
    alert('تعذر الحذف')
  }
}

async function refreshPickerData() {
  const cid = pickerCampaignId.value
  if (!cid) return
  labelsLoading.value = true
  labelFormError.value = ''
  try {
    const attachedP = $fetch<{ data: Label[] }>(
      `/api/${workspaceSlug.value}/campaigns/${cid}/labels`,
    )
    if (can('manage_campaigns')) {
      const [all, att] = await Promise.all([
        $fetch<{ data: Label[] }>(`/api/${workspaceSlug.value}/labels`),
        attachedP,
      ])
      workspaceAllLabels.value = all.data ?? []
      campaignLabels.value = att.data ?? []
      selectedLabelIds.value = (att.data ?? []).map((l) => l.id)
    }
    else {
      const att = await attachedP
      campaignLabels.value = att.data ?? []
    }
  }
  catch {
    campaignLabels.value = []
    workspaceAllLabels.value = []
    selectedLabelIds.value = []
    labelFormError.value = 'تعذر تحميل التصنيفات'
  }
  finally {
    labelsLoading.value = false
  }
}

function openLabelPicker(campaignId: string | null, e: Event) {
  const target = (e?.currentTarget as HTMLElement) ?? null
  labelPopAnchorEl.value = target
  applyPopoverPosition()
  showCampaignSelect.value = !campaignId

  const first = campaigns.value[0]?.id ?? ''
  pickerCampaignId.value = campaignId ?? first
  if (!pickerCampaignId.value) {
    alert('لا توجد حملات بعد.')
    return
  }

  labelPopOpen.value = true
  labelSearch.value = ''
  labelsLinkError.value = ''
  cancelWorkspaceLabelEdit()
  nextTick(() => {
    applyPopoverPosition()
    refreshPickerData()
  })
}

async function onPickerCampaignChange() {
  if (labelPopOpen.value) await refreshPickerData()
}

function setLabelOnCampaign(id: string, checked: boolean) {
  const has = selectedLabelIds.value.includes(id)
  if (checked && !has)
    selectedLabelIds.value = [...selectedLabelIds.value, id]
  else if (!checked && has)
    selectedLabelIds.value = selectedLabelIds.value.filter((x) => x !== id)
}

function onLabelCheckChange(ev: Event, id: string) {
  const t = ev.target as HTMLInputElement
  setLabelOnCampaign(id, t.checked)
}

async function saveCampaignLabelLinks(): Promise<boolean> {
  const cid = pickerCampaignId.value
  if (!cid) return false
  labelsLinkError.value = ''
  labelsLinkSaving.value = true
  try {
    const res = await $fetch<{ data: Label[] }>(
      `/api/${workspaceSlug.value}/campaigns/${cid}/labels`,
      {
        method: 'PUT',
        body: { label_ids: [...selectedLabelIds.value] },
      },
    )
    campaignLabels.value = res.data ?? []
    await load()
    return true
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    labelsLinkError.value = err?.data?.message ?? err?.message ?? 'فشل حفظ الربط'
    return false
  }
  finally {
    labelsLinkSaving.value = false
  }
}

function startEditWorkspaceLabel(lb: Label) {
  editingWorkspaceLabelId.value = lb.id
  labelForm.name = lb.name
  labelForm.color = lb.color || '#6B7280'
  labelFormError.value = ''
}

function cancelWorkspaceLabelEdit() {
  editingWorkspaceLabelId.value = null
  labelForm.name = ''
  labelForm.color = '#6B7280'
  labelFormError.value = ''
}

async function submitWorkspaceLabel() {
  if (!labelForm.name.trim()) return
  labelFormError.value = ''
  labelSaving.value = true
  const editingId = editingWorkspaceLabelId.value
  const cid = pickerCampaignId.value
  try {
    if (editingId) {
      await $fetch(`/api/${workspaceSlug.value}/labels/${editingId}`, {
        method: 'PUT',
        body: { name: labelForm.name.trim(), color: labelForm.color },
      })
      const res = await $fetch<{ data: Label[] }>(`/api/${workspaceSlug.value}/labels`)
      workspaceAllLabels.value = res.data ?? []
      if (cid) {
        const att = await $fetch<{ data: Label[] }>(
          `/api/${workspaceSlug.value}/campaigns/${cid}/labels`,
        )
        campaignLabels.value = att.data ?? []
      }
      cancelWorkspaceLabelEdit()
      await load()
    }
    else {
      const created = await $fetch<{ data: Label }>(`/api/${workspaceSlug.value}/labels`, {
        method: 'POST',
        body: { name: labelForm.name.trim(), color: labelForm.color },
      })
      if (created.data && cid) {
        workspaceAllLabels.value = [...workspaceAllLabels.value, created.data].sort((a, b) =>
          a.name.localeCompare(b.name, 'ar'),
        )
        if (!selectedLabelIds.value.includes(created.data.id))
          selectedLabelIds.value = [...selectedLabelIds.value, created.data.id]
        const ok = await saveCampaignLabelLinks()
        if (!ok) return
      }
      cancelWorkspaceLabelEdit()
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    labelFormError.value = err?.data?.message ?? err?.message ?? 'فشل الحفظ'
  }
  finally {
    labelSaving.value = false
  }
}

async function deleteWorkspaceLabel(lb: Label) {
  if (!confirm(`حذف «${lb.name}» من المساحة؟ يُزال من كل الحملات المربوطة.`)) return
  try {
    await $fetch(`/api/${workspaceSlug.value}/labels/${lb.id}`, { method: 'DELETE' })
    workspaceAllLabels.value = workspaceAllLabels.value.filter((x) => x.id !== lb.id)
    selectedLabelIds.value = selectedLabelIds.value.filter((x) => x !== lb.id)
    campaignLabels.value = campaignLabels.value.filter((x) => x.id !== lb.id)
    if (editingWorkspaceLabelId.value === lb.id)
      cancelWorkspaceLabelEdit()
    await load()
  }
  catch {
    alert('تعذر الحذف')
  }
}

watch(labelPopOpen, (open) => {
  if (!open) {
    labelPopAnchorEl.value = null
    pickerCampaignId.value = ''
    campaignLabels.value = []
    workspaceAllLabels.value = []
    selectedLabelIds.value = []
    labelSearch.value = ''
    labelsLinkError.value = ''
    cancelWorkspaceLabelEdit()
    labelFormError.value = ''
  }
  else {
    nextTick(() => applyPopoverPosition())
  }
})

onMounted(async () => {
  document.addEventListener('pointerdown', onGlobalPointerDown, true)
  window.addEventListener('resize', onWindowResize)
  try {
    await load()
  }
  finally {
    loading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onGlobalPointerDown, true)
  window.removeEventListener('resize', onWindowResize)
})
</script>
