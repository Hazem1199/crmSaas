<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-2">إكمال الانضمام</h2>
    <p class="text-sm text-gray-500 mb-6">
      <template v-if="inviteeHasAccount">
        لديك حساب مسبقاً — أدخل كلمة المرور <span class="font-medium text-gray-700">الحالية</span> لتأكيد هويتك والانضمام إلى
      </template>
      <template v-else>
        أكمل بياناتك للدخول إلى مساحة العمل
      </template>
      <span v-if="workspaceName" class="font-medium text-gray-700">«{{ workspaceName }}»</span>
    </p>

    <div v-if="pageLoading" class="text-center py-8 text-gray-500 text-sm">جاري التحميل...</div>

    <div
      v-else-if="resolveError"
      class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
    >
      {{ resolveError }}
    </div>

    <!-- مستخدم مسجّل مسبقاً: كلمة مرور حالية ثم قبول بالجلسة -->
    <form v-else-if="inviteeHasAccount" class="space-y-4" @submit.prevent="handleSubmitExisting">
      <BaseInput
        :model-value="emailDisplay"
        label="البريد الإلكتروني"
        type="email"
        disabled
        hint="يجب أن يطابق حسابك"
      />

      <BaseInput
        v-model="password"
        label="كلمة المرور الحالية"
        type="password"
        placeholder="كلمة مرور حسابك"
        required
        :error="fieldErrors.password"
      />

      <p class="text-xs text-gray-500">
        إذا نسيت كلمة المرور يمكنك استعادتها من صفحة تسجيل الدخول ثم العودة لهذا الرابط.
      </p>

      <div v-if="sessionHint" class="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
        {{ sessionHint }}
      </div>

      <div v-if="globalError" class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {{ globalError }}
      </div>

      <BaseButton type="submit" class="w-full justify-center" :loading="submitting" :disabled="!canSubmitExisting">
        تسجيل الدخول والانضمام
      </BaseButton>
    </form>

    <!-- حساب جديد من الدعوة -->
    <form v-else class="space-y-4" @submit.prevent="handleSubmitNew">
      <BaseInput
        v-model="fullName"
        label="الاسم الكامل"
        placeholder="اسمك كما يظهر للفريق"
        required
        :error="fieldErrors.full_name"
      />

      <BaseInput
        :model-value="emailDisplay"
        label="البريد الإلكتروني"
        type="email"
        disabled
        hint="يُستخرج من رابط الدعوة"
      />

      <BaseInput
        v-model="password"
        label="كلمة المرور"
        type="password"
        placeholder="8 أحرف على الأقل"
        required
        :error="fieldErrors.password"
      />

      <BaseInput
        v-model="passwordConfirm"
        label="تأكيد كلمة المرور"
        type="password"
        placeholder="أعد إدخال كلمة المرور"
        required
        :error="fieldErrors.password_confirm"
      />

      <div v-if="sessionHint" class="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
        {{ sessionHint }}
      </div>

      <div v-if="globalError" class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {{ globalError }}
      </div>

      <BaseButton type="submit" class="w-full justify-center" :loading="submitting" :disabled="!canSubmitNew">
        إنشاء الحساب والدخول
      </BaseButton>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()

const pageLoading = ref(true)
const resolveError = ref('')
const workspaceName = ref<string | null>(null)
const emailDisplay = ref('')
const invitationId = ref('')
const token = ref('')
const inviteeHasAccount = ref(false)

const fullName = ref('')
const password = ref('')
const passwordConfirm = ref('')
const fieldErrors = reactive({ full_name: '', password: '', password_confirm: '' })
const globalError = ref('')
const submitting = ref(false)
const sessionHint = ref('')

const canSubmitExisting = computed(() => {
  return !!invitationId.value && !!token.value && !resolveError.value && inviteeHasAccount.value
})

const canSubmitNew = computed(() => {
  return !!invitationId.value && !!token.value && !resolveError.value && !inviteeHasAccount.value
})

async function loadResolve() {
  pageLoading.value = true
  resolveError.value = ''
  workspaceName.value = null
  emailDisplay.value = ''
  inviteeHasAccount.value = false

  const id = typeof route.query.invitation_id === 'string' ? route.query.invitation_id : ''
  const t = typeof route.query.token === 'string' ? route.query.token : ''
  invitationId.value = id
  token.value = t

  if (!id || !t) {
    resolveError.value = 'رابط الدعوة غير مكتمل. افتح الرابط من البريد الإلكتروني.'
    pageLoading.value = false
    return
  }

  try {
    const res = await $fetch<{
      valid: boolean
      status?: string
      invitee_email: string
      invitee_has_account?: boolean
      workspace_name: string | null
    }>('/api/invitations/resolve', {
      query: { invitation_id: id, token: t },
    })

    if (!res.valid) {
      resolveError.value =
        res.status === 'expired'
          ? 'انتهت صلاحية هذه الدعوة.'
          : res.status === 'accepted'
            ? 'تم قبول هذه الدعوة مسبقاً.'
            : 'هذه الدعوة لم تعد صالحة.'
      return
    }

    emailDisplay.value = res.invitee_email
    workspaceName.value = res.workspace_name
    inviteeHasAccount.value = res.invitee_has_account === true

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email && session.user.email.toLowerCase() !== res.invitee_email.toLowerCase()) {
      sessionHint.value =
        'أنت مسجّل الدخول بحساب آخر. سجّل الخروج أولاً أو استخدم نافذة خاصة لقبول الدعوة.'
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    resolveError.value = err?.data?.message ?? err?.message ?? 'تعذر التحقق من الدعوة'
  }
  finally {
    pageLoading.value = false
  }
}

async function handleSubmitExisting() {
  globalError.value = ''
  fieldErrors.password = ''

  if (!password.value) {
    fieldErrors.password = 'كلمة المرور مطلوبة'
    return
  }

  submitting.value = true
  try {
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: emailDisplay.value,
      password: password.value,
    })

    if (signErr) {
      globalError.value =
        signErr.message === 'Invalid login credentials'
          ? 'كلمة المرور غير صحيحة'
          : signErr.message
      return
    }

    const result = await $fetch<{ ok: boolean; workspace_slug: string | null }>('/api/invitations/accept-existing', {
      method: 'POST',
      body: {
        invitation_id: invitationId.value,
        token: token.value,
      },
    })

    if (result.workspace_slug) {
      try {
        localStorage.setItem('crm_last_workspace_slug', result.workspace_slug)
      }
      catch {
        // ignore
      }
    }

    await navigateTo('/')
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    globalError.value = err?.data?.message ?? err?.message ?? 'تعذر إكمال قبول الدعوة'
  }
  finally {
    submitting.value = false
  }
}

async function handleSubmitNew() {
  globalError.value = ''
  fieldErrors.full_name = ''
  fieldErrors.password = ''
  fieldErrors.password_confirm = ''

  if (!fullName.value.trim()) {
    fieldErrors.full_name = 'الاسم مطلوب'
    return
  }
  if (password.value.length < 8) {
    fieldErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    return
  }
  if (password.value !== passwordConfirm.value) {
    fieldErrors.password_confirm = 'تأكيد كلمة المرور غير متطابق'
    return
  }

  submitting.value = true
  try {
    const result = await $fetch<{ ok: boolean; workspace_slug: string | null }>('/api/invitations/accept', {
      method: 'POST',
      body: {
        invitation_id: invitationId.value,
        token: token.value,
        full_name: fullName.value.trim(),
        password: password.value,
        password_confirm: passwordConfirm.value,
      },
    })

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: emailDisplay.value,
      password: password.value,
    })

    if (signErr) {
      globalError.value =
        signErr.message === 'Invalid login credentials'
          ? 'تم حفظ البيانات لكن تعذر تسجيل الدخول تلقائياً. جرّب من صفحة تسجيل الدخول.'
          : signErr.message
      if (result.workspace_slug) {
        await navigateTo('/auth/login')
      }
      return
    }

    if (result.workspace_slug) {
      try {
        localStorage.setItem('crm_last_workspace_slug', result.workspace_slug)
      }
      catch {
        // ignore
      }
    }

    await navigateTo('/')
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    globalError.value = err?.data?.message ?? err?.message ?? 'تعذر إكمال الطلب'
  }
  finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadResolve()
})
</script>
