// middleware/auth.ts
// التحقق من تسجيل الدخول في جميع الصفحات (ما عدا /auth/*)
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value && !to.path.startsWith('/auth') && to.path !== '/confirm') {
    return navigateTo('/auth/login')
  }

  if (user.value && to.path.startsWith('/auth')) {
    return navigateTo('/')
  }
})
