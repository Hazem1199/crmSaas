// GET /api/workspaces/mine — مساحات العمل المرتبطة بالمستخدم (فعّالة / معطّلة)
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authErr } = await client.auth.getUser()

  if (authErr || !user) {
    throw createError({ statusCode: 401, message: 'يجب تسجيل الدخول' })
  }

  const svc = useServiceRoleClient()

  const { data: rows, error } = await svc
    .from('workspace_members')
    .select(`
      is_active,
      workspaces ( id, name, slug, deleted_at )
    `)
    .eq('user_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  type Ws = { id: string; name: string; slug: string }
  const active: Ws[] = []
  const inactive: Ws[] = []

  for (const r of rows ?? []) {
    const ws = r.workspaces as { id: string; name: string; slug: string; deleted_at: string | null } | null
    const w = Array.isArray(ws) ? ws[0] : ws
    if (!w || w.deleted_at) continue
    const item: Ws = { id: w.id, name: w.name, slug: w.slug }
    if (r.is_active) active.push(item)
    else inactive.push(item)
  }

  return { active, inactive }
})
