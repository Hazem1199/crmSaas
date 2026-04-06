<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-900">حالات العميل</h3>
      <BaseButton size="sm" @click="showModal = true">إضافة حالة</BaseButton>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-400 text-sm">جاري التحميل...</div>
    <div v-else class="space-y-2">
      <div
        v-for="status in statuses"
        :key="status.id"
        class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
      >
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: status.color }" />
          <span class="text-sm font-medium text-gray-900">{{ status.name }}</span>
        </div>
        <button
          class="text-xs px-3 py-1 rounded border transition-colors"
          :class="status.is_active
            ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
            : 'border-gray-200 text-gray-500 hover:bg-gray-100'"
          @click="toggleStatus(status)"
        >
          {{ status.is_active ? 'مفعّل' : 'معطّل' }}
        </button>
      </div>
      <div v-if="!statuses.length" class="text-center py-6 text-gray-400 text-sm">
        لا توجد حالات بعد
      </div>
    </div>

    <BaseModal v-model="showModal" title="إضافة حالة جديدة">
      <form @submit.prevent="addStatus" class="space-y-4">
        <BaseInput v-model="form.name" label="اسم الحالة" placeholder="مثال: متابعة" required />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">اللون</label>
          <input v-model="form.color" type="color" class="w-16 h-10 rounded cursor-pointer border border-gray-300" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">إلغاء</BaseButton>
          <BaseButton type="submit" :loading="saving">حفظ</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import type { Status } from '~/types'

definePageMeta({ layout: 'default', middleware: ['auth', 'workspace'] })

const route = useRoute()
const supabase = useSupabaseClient()
const workspaceSlug = computed(() => route.params.workspace as string)
const { workspace } = useWorkspace()

const statuses = ref<Status[]>([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const form = reactive({ name: '', color: '#6B7280' })

const load = async () => {
  const result = await $fetch<{ data: Status[] }>(`/api/${workspaceSlug.value}/settings/statuses`)
  statuses.value = result.data ?? []
}

const addStatus = async () => {
  if (!form.name.trim() || !workspace.value) return
  saving.value = true
  try {
    await supabase.from('statuses').insert({
      workspace_id: workspace.value.id,
      name: form.name,
      color: form.color,
    })
    form.name = ''
    showModal.value = false
    await load()
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (status: Status) => {
  await supabase.from('statuses').update({ is_active: !status.is_active }).eq('id', status.id)
  status.is_active = !status.is_active
}

onMounted(async () => {
  try { await load() } finally { loading.value = false }
})
</script>
