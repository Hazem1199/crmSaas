<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
    <p v-if="loading" class="text-gray-500">جاري التحميل...</p>

    <div
      v-else-if="routeError"
      class="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm text-center"
    >
      <p class="text-sm text-red-800 mb-4">{{ routeError }}</p>
      <button
        type="button"
        class="text-primary-600 text-sm font-medium hover:underline"
        @click="retryMine"
      >
        إعادة المحاولة
      </button>
    </div>

    <div
      v-else-if="showInactiveOnly"
      class="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-8 shadow-sm text-center"
    >
      <h1 class="text-lg font-bold text-amber-900 mb-2">لا توجد مساحات فعّالة</h1>
      <p class="text-sm text-amber-800 mb-4">
        عضويتك في المساحات التالية غير فعّالة. تواصل مع مسؤول المساحة لتفعيلها.
      </p>
      <ul class="text-sm text-amber-900 text-right list-disc list-inside mb-6">
        <li v-for="w in inactiveWorkspaces" :key="w.id">{{ w.name }}</li>
      </ul>
      <NuxtLink to="/auth/login" class="text-primary-600 text-sm font-medium hover:underline">
        العودة لتسجيل الدخول
      </NuxtLink>
    </div>

    <div
      v-else-if="showWorkspacePicker"
      class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <h1 class="text-xl font-bold text-gray-900 mb-1">اختر مساحة العمل</h1>
      <p class="text-sm text-gray-500 mb-6">أنت عضو في أكثر من مساحة — اختر أين تريد العمل الآن.</p>

      <div class="space-y-3">
        <button
          v-for="w in workspaceChoices"
          :key="w.id"
          type="button"
          class="w-full flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-right hover:bg-gray-50 transition-colors"
          @click="pickWorkspace(w.slug)"
        >
          <span class="font-medium text-gray-900">{{ w.name }}</span>
          <span class="text-xs text-gray-400">{{ w.slug }}</span>
        </button>
      </div>
    </div>

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

const LAST_WS_KEY = 'crm_last_workspace_slug'

const loading = ref(true)
const showOnboarding = ref(false)
const showWorkspacePicker = ref(false)
const showInactiveOnly = ref(false)
const workspaceChoices = ref<{ id: string; name: string; slug: string }[]>([])
const inactiveWorkspaces = ref<{ id: string; name: string; slug: string }[]>([])

const workspaceName = ref('')
const workspaceSlug = ref('')
const fieldErrors = reactive({ name: '', slug: '' })
const formError = ref('')
const submitting = ref(false)
const routeError = ref('')

function pickWorkspace(slug: string) {
  try {
    localStorage.setItem(LAST_WS_KEY, slug)
  }
  catch {
    // ignore
  }
  void navigateTo(`/${slug}/dashboard`, { replace: true })
}

async function goToWorkspace() {
  routeError.value = ''

  if (!user.value) {
    loading.value = false
    await navigateTo('/auth/login', { replace: true })
    return
  }

  loading.value = true

  try {
    const mine = await $fetch<{
      active: { id: string; name: string; slug: string }[]
      inactive: { id: string; name: string; slug: string }[]
    }>('/api/workspaces/mine')

    const active = mine.active ?? []
    const inactive = mine.inactive ?? []

    if (active.length === 0) {
      if (inactive.length > 0) {
        inactiveWorkspaces.value = inactive
        showInactiveOnly.value = true
        loading.value = false
        return
      }
      loading.value = false
      showOnboarding.value = true
      return
    }

    if (active.length === 1) {
      pickWorkspace(active[0].slug)
      return
    }

    let lastSlug = ''
    try {
      lastSlug = localStorage.getItem(LAST_WS_KEY) ?? ''
    }
    catch {
      lastSlug = ''
    }
    const sorted = [...active]
    if (lastSlug) {
      sorted.sort((a, b) => {
        if (a.slug === lastSlug) return -1
        if (b.slug === lastSlug) return 1
        return 0
      })
    }

    workspaceChoices.value = sorted
    loading.value = false
    showWorkspacePicker.value = true
  }
  catch (e: unknown) {
    loading.value = false
    const err = e as { data?: { message?: string }; message?: string }
    routeError.value =
      err?.data?.message ?? err?.message ?? 'تعذر تحميل مساحات العمل. تحقق من الاتصال وحاول مرة أخرى.'
  }
}

async function retryMine() {
  routeError.value = ''
  loading.value = true
  showOnboarding.value = false
  showWorkspacePicker.value = false
  showInactiveOnly.value = false
  await goToWorkspace()
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

    pickWorkspace(res.slug)
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
  { immediate: true },
)
</script>
