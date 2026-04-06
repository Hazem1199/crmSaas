// middleware/workspace.ts
// التحقق من عضوية المستخدم في مساحة العمل
export default defineNuxtRouteMiddleware(async (to) => {
  const workspaceSlug = to.params.workspace as string
  if (!workspaceSlug) return

  const store = useWorkspaceStore()
  const user = useSupabaseUser()

  if (!user.value) return navigateTo('/auth/login')

  // إذا كانت مساحة العمل محملة بالفعل، لا داعي لإعادة الجلب
  if (store.currentWorkspace?.slug === workspaceSlug) return

  const found = await store.fetchWorkspace(workspaceSlug)

  if (!found) {
    throw createError({ statusCode: 404, message: 'مساحة العمل غير موجودة' })
  }

  if (!store.myMembership) {
    throw createError({ statusCode: 403, message: 'ليس لديك صلاحية الوصول لهذه المساحة' })
  }
})
