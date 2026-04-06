// GET /api/[workspace]/members — أعضاء مساحة العمل مع أسماء البروفايل (للقوائم والتعيين)
import { requireWorkspaceMember } from '../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceMember(event)
  const svc = useServiceRoleClient()

  const { data: members, error } = await svc
    .from('workspace_members')
    .select('id, workspace_id, user_id, role, joined_at, is_active, invited_by')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('joined_at')

  if (error) throw createError({ statusCode: 500, message: error.message })

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))]
  if (!userIds.length) {
    return { data: [] }
  }

  const { data: profiles, error: pErr } = await svc
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  if (pErr) throw createError({ statusCode: 500, message: pErr.message })

  const pmap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  const data = (members ?? []).map((m) => ({
    ...m,
    profile: pmap[m.user_id] ?? null,
  }))

  return { data }
})
