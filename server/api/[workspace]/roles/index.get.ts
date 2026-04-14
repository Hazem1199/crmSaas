// GET /api/[workspace]/roles — قائمة الأدوار + عدد الأعضاء
import { requireWorkspaceMember } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceMember(event)
  const svc = useServiceRoleClient()

  const { data: roles, error } = await svc
    .from('workspace_roles')
    .select('id, name, slug, is_owner_role, is_default_invite_role, distribute_customers_to_role, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const { data: counts } = await svc
    .from('workspace_members')
    .select('workspace_role_id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  const countMap = new Map<string, number>()
  for (const row of counts ?? []) {
    const rid = row.workspace_role_id as string
    countMap.set(rid, (countMap.get(rid) ?? 0) + 1)
  }

  const data = (roles ?? []).map((r) => ({
    ...r,
    member_count: countMap.get(r.id) ?? 0,
  }))

  return { data }
})
