<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
    <p v-if="loading" class="text-gray-500">جاري التحميل...</p>

    <div
      v-else-if="showOnboarding"
      class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <h1 class="text-xl font-bold text-gray-900 mb-1">أنشئ مساحة عملك</h1>
      <p class="text-sm text-gray-500 mb-6">
        أنت صاحب الحساب — عيّن اسم شركتك ومعرّفاً للرابط (بالإنجليزية) للدخول إلى لوحة التحكم.
      </p>

      <form class="space-y-4" @submit.prevent="submitWorkspace">
        <BaseInput
          v-model="workspaceName"
          label="اسم مساحة العمل"
          placeholder="مثال: شركة النور"
          required
          :error="fieldErrors.name"
        />
        <BaseInput
          v-model="workspaceSlug"
          label="معرّف الرابط"
          placeholder="مثال: al-noor"
          :error="fieldErrors.slug"
          hint="أحرف إنجليزية صغيرة وأرقام وشرطات فقط. إن تركت الحقل فارغاً يُولَّد تلقائياً عند الإمكان."
        />

        <div
          v-if="formError"
          class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {{ formError }}
        </div>

        <BaseButton type="submit" class="w-full justify-center" :loading="submitting">
          إنشاء مساحة العمل والمتابعة
        </BaseButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ['auth'],
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const showOnboarding = ref(false)

const workspaceName = ref('')
const workspaceSlug = ref('')
const fieldErrors = reactive({ name: '', slug: '' })
const formError = ref('')
const submitting = ref(false)

async function goToWorkspace() {
  if (!user.value) {
    loading.value = false
    await navigateTo('/auth/login', { replace: true })
    return
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.value.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    loading.value = false
    showOnboarding.value = true
    return
  }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', membership.workspace_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (ws?.slug) {
    await navigateTo(`/${ws.slug}/dashboard`, { replace: true })
    return
  }

  loading.value = false
  showOnboarding.value = true
}

async function submitWorkspace() {
  formError.value = ''
  fieldErrors.name = ''
  fieldErrors.slug = ''

  if (!workspaceName.value.trim()) {
    fieldErrors.name = 'الاسم مطلوب'
    return
  }

  submitting.value = true
  try {
    const body: { name: string; slug?: string } = {
      name: workspaceName.value.trim(),
    }
    const s = workspaceSlug.value.trim()
    if (s) {
      body.slug = s
    }

    const res = await $fetch<{ slug: string }>('/api/onboarding/workspace', {
      method: 'POST',
      body,
    })

    await navigateTo(`/${res.slug}/dashboard`, { replace: true })
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    formError.value =
      err?.data?.message ?? err?.message ?? 'تعذر إنشاء مساحة العمل. حاول مرة أخرى.'
  }
  finally {
    submitting.value = false
  }
}

watch(
  user,
  async (u) => {
    if (!u) return
    await goToWorkspace()
  },
  { immediate: true }
)
</script>
