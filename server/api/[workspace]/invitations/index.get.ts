// GET /api/[workspace]/invitations — قائمة الدعوات (team.manage)
import { requireWorkspacePermission } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'team.manage')
  const svc = useServiceRoleClient()

  await svc.rpc('expire_old_workspace_invitations')

  const { data, error } = await svc
    .from('workspace_invitations')
    .select(`
      id,
      invitee_email,
      status,
      created_at,
      expires_at,
      accepted_at,
      workspace_roles ( id, name, slug )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const list = (data ?? []).map((row) => {
    const wr = row.workspace_roles as { id: string; name: string; slug: string } | null
    const role = Array.isArray(wr) ? wr[0] : wr
    return {
      id: row.id,
      invitee_email: row.invitee_email,
      status: row.status,
      created_at: row.created_at,
      expires_at: row.expires_at,
      accepted_at: row.accepted_at,
      role,
    }
  })

  return { data: list }
})
