<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
    <p class="text-sm text-gray-500 mb-6">أدخل بياناتك للوصول إلى لوحة التحكم</p>

    <form @submit.prevent="handleLogin" class="space-y-4">
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
        placeholder="••••••••"
        required
        :error="errors.password"
      />

      <div v-if="globalError" class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {{ globalError }}
      </div>

      <BaseButton type="submit" class="w-full justify-center" :loading="loading">
        تسجيل الدخول
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      ليس لديك حساب؟
      <NuxtLink to="/auth/register" class="text-primary-600 hover:underline font-medium">
        إنشاء حساب
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()

const email = ref('')
const password = ref('')
const loading = ref(false)
const globalError = ref('')
const errors = reactive({ email: '', password: '' })

const handleLogin = async () => {
  globalError.value = ''
  errors.email = ''
  errors.password = ''

  if (!email.value) { errors.email = 'البريد الإلكتروني مطلوب'; return }
  if (!password.value) { errors.password = 'كلمة المرور مطلوبة'; return }

  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      globalError.value = error.message === 'Invalid login credentials'
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : error.message
      return
    }

    await navigateTo('/')
  } finally {
    loading.value = false
  }
}
</script>
