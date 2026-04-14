<template>
  <div>
    <div class="mb-6">
      <NuxtLink :to="`/${workspaceSlug}/roles`" class="text-sm text-primary-600 hover:underline mb-2 inline-block">
        ← الأدوار
      </NuxtLink>
      <h1 class="text-xl font-bold text-gray-900">{{ roleName }}</h1>
      <p class="text-sm text-gray-500 mt-0.5">تعديل الصلاحيات الممنوحة لهذا الدور</p>
    </div>

    <div v-if="loadError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {{ loadError }}
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">جاري التحميل...</div>

    <div v-else class="card p-6 space-y-8">
      <div v-for="mod in groupedModules" :key="mod" class="space-y-3">
        <h2 class="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">{{ moduleLabel(mod) }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            v-for="def in defsByModule[mod]"
            :key="def.key"
            class="flex items-start gap-3 text-sm cursor-pointer"
          >
            <input
              v-model="selectedKeys"
              type="checkbox"
              class="rounded border-gray-300 mt-0.5"
              :value="def.key"
            />
            <span class="text-gray-700 leading-snug">{{ def.label_ar }}</span>
          </label>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 items-center border-t border-gray-100 pt-6">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="flags.is_default_invite_role" type="checkbox" class="rounded border-gray-300" />
          دور افتراضي للموظفين الجدد
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="flags.distribute_customers_to_role" type="checkbox" class="rounded border-gray-300" />
          يمكن توزيع العملاء على موظفي هذا الدور
        </label>
      </div>

      <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

      <div class="flex justify-end">
        <BaseButton :loading="saving" @click="save">حفظ</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'workspace'],
})

const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)
const roleId = computed(() => route.params.id as string)

interface DefRow {
  key: string
  module: string
  label_ar: string
  sort_order: number
}

const loading = ref(true)
const loadError = ref('')
const saveError = ref('')
const saving = ref(false)
const roleName = ref('')
const definitions = ref<DefRow[]>([])
const selectedKeys = ref<string[]>([])
const flags = reactive({
  is_default_invite_role: false,
  distribute_customers_to_role: false,
})

const defsByModule = computed(() => {
  const m: Record<string, DefRow[]> = {}
  for (const d of definitions.value) {
    if (!m[d.module]) m[d.module] = []
    m[d.module].push(d)
  }
  return m
})

const groupedModules = computed(() => Object.keys(defsByModule.value).sort())

function moduleLabel(mod: string): string {
  const map: Record<string, string> = {
    workspace: 'المساحة',
    team: 'فريق العمل',
    roles: 'الأدوار',
    facebook: 'فيسبوك',
    leads: 'العملاء المحتملون',
    settings: 'الإعدادات',
    labels: 'التصنيفات',
    campaigns: 'الحملات',
    sms: 'الرسائل',
    templates: 'القوالب',
    automations: 'الأتمتة',
    invoices: 'الفواتير',
    reports: 'التقارير',
  }
  return map[mod] ?? mod
}

async function load() {
  loadError.value = ''
  try {
    const [defsRes, roleRes] = await Promise.all([
      $fetch<{ data: DefRow[] }>(`/api/${workspaceSlug.value}/permissions/definitions`),
      $fetch<{ data: Record<string, unknown> }>(`/api/${workspaceSlug.value}/roles/${roleId.value}`),
    ])
    definitions.value = defsRes.data ?? []
    const d = roleRes.data
    if (!d || (d as { is_owner_role?: boolean }).is_owner_role) {
      throw new Error('لا يمكن تعديل دور المالك')
    }
    roleName.value = (d.name as string) ?? ''
    flags.is_default_invite_role = !!(d as { is_default_invite_role?: boolean }).is_default_invite_role
    flags.distribute_customers_to_role = !!(d as { distribute_customers_to_role?: boolean }).distribute_customers_to_role
    selectedKeys.value = [...((d as { permission_keys?: string[] }).permission_keys ?? [])]
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    loadError.value = err?.data?.message ?? err?.message ?? 'تعذر التحميل'
  }
}

async function save() {
  saveError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/${workspaceSlug.value}/roles/${roleId.value}`, {
      method: 'PUT',
      body: {
        permission_keys: selectedKeys.value,
        is_default_invite_role: flags.is_default_invite_role,
        distribute_customers_to_role: flags.distribute_customers_to_role,
      },
    })
    await navigateTo(`/${workspaceSlug.value}/roles`)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    saveError.value = err?.data?.message ?? err?.message ?? 'فشل الحفظ'
  }
  finally {
    saving.value = false
  }
}

onMounted(async () => {
  await load()
  loading.value = false
})
</script>
