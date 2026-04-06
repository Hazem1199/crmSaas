<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-2">إنشاء حساب جديد</h2>
    <p class="text-sm text-gray-500 mb-6">ابدأ تجربتك مع نظام CRM</p>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <BaseInput
        v-model="fullName"
        label="الاسم الكامل"
        placeholder="محمد أحمد"
        required
        :error="errors.fullName"
      />

      <BaseInput
        v-model="email"
        label="البريد الإلكتروني"
        type="email"
        placeholder="example@email.com"
        required
        :error="errors.email"
      />

      <BaseInput
        v-model="password"
        label="كلمة المرور"
        type="password"
        placeholder="٨ أحرف على الأقل"
        required
        :error="errors.password"
      />

      <div v-if="globalError" class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {{ globalError }}
      </div>

      <div v-if="success" class="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
        تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.
      </div>

      <BaseButton type="submit" class="w-full justify-center" :loading="loading">
        إنشاء الحساب
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      لديك حساب بالفعل؟
      <NuxtLink to="/auth/login" class="text-primary-600 hover:underline font-medium">
        تسجيل الدخول
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()

const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const success = ref(false)
const globalError = ref('')
const errors = reactive({ fullName: '', email: '', password: '' })

const handleRegister = async () => {
  globalError.value = ''
  if (!fullName.value)  { errors.fullName = 'الاسم مطلوب'; return }
  if (!email.value)     { errors.email = 'البريد الإلكتروني مطلوب'; return }
  if (password.value.length < 8) { errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'; return }

  loading.value = true
  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { data: { full_name: fullName.value } },
    })

    if (error) { globalError.value = error.message; return }
    success.value = true
  } finally {
    loading.value = false
  }
}
</script>
