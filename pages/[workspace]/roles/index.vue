<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">الأدوار</h1>
        <p class="text-sm text-gray-500 mt-0.5">صلاحيات الوصول لكل دور داخل مساحة العمل</p>
      </div>
      <BaseButton
        v-if="can('roles.manage')"
        size="sm"
        @click="openCreate = true"
      >
        إضافة دور
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
              <th class="px-4 py-3 text-right font-medium text-gray-700">الدور</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 w-28">الإجمالي</th>
              <th v-if="can('roles.manage')" class="px-4 py-3 text-left font-medium text-gray-700 w-32">إجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="row in roles" :key="row.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-3 font-medium text-gray-900">{{ row.name }}</td>
              <td class="px-4 py-3 tabular-nums text-gray-700">{{ row.member_count }}</td>
              <td v-if="can('roles.manage')" class="px-4 py-3">
                <NuxtLink
                  v-if="!row.is_owner_role"
                  :to="`/${workspaceSlug}/roles/${row.id}`"
                  class="text-sm text-primary-600 hover:underline"
                >
                  تعديل
                </NuxtLink>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal v-model="openCreate" title="دور جديد">
      <form class="space-y-4" @submit.prevent="createRole">
        <BaseInput v-model="newName" label="اسم الدور" placeholder="مثال: مشرف مبيعات" required />
        <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        <div class="flex justify-end gap-2">
          <BaseButton type="button" variant="secondary" @click="openCreate = false">إلغاء</BaseButton>
          <BaseButton type="submit" :loading="creating">إنشاء</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceRole } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'workspace'],
})

const route = useRoute()
const { can } = usePermissions()
const workspaceSlug = computed(() => route.params.workspace as string)

type RoleRow = WorkspaceRole & { member_count: number }

const roles = ref<RoleRow[]>([])
const loading = ref(true)
const loadError = ref('')
const openCreate = ref(false)
const newName = ref('')
const createError = ref('')
const creating = ref(false)

async function load() {
  loadError.value = ''
  try {
    const res = await $fetch<{ data: RoleRow[] }>(`/api/${workspaceSlug.value}/roles`)
    roles.value = res.data ?? []
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    loadError.value = err?.data?.message ?? err?.message ?? 'تعذر التحميل'
    roles.value = []
  }
}

async function createRole() {
  createError.value = ''
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await $fetch(`/api/${workspaceSlug.value}/roles`, {
      method: 'POST',
      body: { name },
    })
    openCreate.value = false
    newName.value = ''
    await load()
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    createError.value = err?.data?.message ?? err?.message ?? 'فشل الإنشاء'
  }
  finally {
    creating.value = false
  }
}

onMounted(async () => {
  await load()
  loading.value = false
})
</script>
