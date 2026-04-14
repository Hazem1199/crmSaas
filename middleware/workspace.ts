// middleware/workspace.ts
// التحقق من عضوية المستخدم في مساحة العمل
export default defineNuxtRouteMiddleware(async (to) => {
  const workspaceSlug = to.params.workspace as string
  if (!workspaceSlug) return

  const store = useWorkspaceStore()
  const user = useSupabaseUser()

  if (!user.value) return navigateTo('/auth/login')

  /** إعادة الجلب دائماً حتى لا تُتجاوز فحوصات is_active أو تغيّر العضوية بسبب كاش قديم */
  const found = await store.fetchWorkspace(workspaceSlug)

  if (!found) {
    throw createError({ statusCode: 404, message: 'مساحة العمل غير موجودة' })
  }

  if (!store.myMembership) {
    throw createError({ statusCode: 403, message: 'ليس لديك صلاحية الوصول لهذه المساحة' })
  }

  if (store.myMembership.is_active === false) {
    throw createError({
      statusCode: 403,
      message: 'عضويتك في هذه المساحة غير فعّالة. تواصل مع مسؤول المساحة.',
    })
  }
})
