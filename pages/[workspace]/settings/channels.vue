<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-900">قنوات الجلب</h3>
      <BaseButton size="sm" @click="showModal = true">إضافة قناة</BaseButton>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-400 text-sm">جاري التحميل...</div>
    <div v-else class="space-y-2">
      <div
        v-for="channel in channels"
        :key="channel.id"
        class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
      >
        <div class="flex items-center gap-3">
          <div :class="channel.is_active ? 'bg-green-100' : 'bg-gray-100'" class="w-2 h-2 rounded-full" />
          <span class="text-sm font-medium text-gray-900">{{ channel.name }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="text-xs px-3 py-1 rounded border transition-colors"
            :class="channel.is_active
              ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
              : 'border-gray-200 text-gray-500 hover:bg-gray-100'"
            @click="toggleChannel(channel)"
          >
            {{ channel.is_active ? 'مفعّل' : 'معطّل' }}
          </button>
        </div>
      </div>
      <div v-if="!channels.length" class="text-center py-6 text-gray-400 text-sm">
        لا توجد قنوات بعد
      </div>
    </div>

    <!-- Add Channel Modal -->
    <BaseModal v-model="showModal" title="إضافة قناة جلب">
      <form @submit.prevent="addChannel" class="space-y-4">
        <BaseInput
          v-model="form.name"
          label="اسم القناة"
          placeholder="مثال: الصفحة الرئيسية، فيسبوك، يدوي…"
          required
          hint="يُستخدم لاحقاً عند إضافة عميل لتحديد مصدره."
        />
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">إلغاء</BaseButton>
          <BaseButton type="submit" :loading="saving">حفظ</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import type { Channel } from '~/types'

definePageMeta({ layout: 'default', middleware: ['auth', 'workspace'] })

const route = useRoute()
const workspaceSlug = computed(() => route.params.workspace as string)

const channels = ref<Channel[]>([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive({ name: '' })

const load = async () => {
  const result = await $fetch<{ data: Channel[] }>(
    `/api/${workspaceSlug.value}/settings/channels`
  )
  channels.value = result.data ?? []
}

const addChannel = async () => {
  formError.value = ''
  if (!form.name.trim()) return
  saving.value = true
  try {
    await $fetch(`/api/${workspaceSlug.value}/settings/channels`, {
      method: 'POST',
      body: { name: form.name.trim() },
    })
    form.name = ''
    showModal.value = false
    await load()
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    formError.value = err?.data?.message ?? err?.message ?? 'تعذر إضافة القناة'
  }
  finally {
    saving.value = false
  }
}

const toggleChannel = async (channel: Channel) => {
  try {
    const { data } = await $fetch<{ data: Channel }>(
      `/api/${workspaceSlug.value}/settings/channels/${channel.id}`,
      { method: 'PATCH', body: { is_active: !channel.is_active } }
    )
    if (data) {
      channel.is_active = data.is_active
    }
  }
  catch {
    alert('تعذر تحديث حالة القناة')
  }
}

onMounted(async () => {
  try { await load() } finally { loading.value = false }
})
</script>
