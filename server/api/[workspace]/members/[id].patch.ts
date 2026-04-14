// PATCH /api/[workspace]/members/:id — تعيين دور العضو (team.manage)
import { requireWorkspacePermission } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'team.manage')
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event).catch(() => ({})) as { workspace_role_id?: string }
  const roleId = typeof body.workspace_role_id === 'string' ? body.workspace_role_id.trim() : ''
  if (!roleId) {
    throw createError({ statusCode: 400, message: 'workspace_role_id مطلوب' })
  }

  const svc = useServiceRoleClient()

  const { data: memRow } = await svc
    .from('workspace_members')
    .select('workspace_role_id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!memRow) {
    throw createError({ statusCode: 404, message: 'العضو غير موجود' })
  }

  const { data: currentRole } = await svc
    .from('workspace_roles')
    .select('is_owner_role')
    .eq('id', memRow.workspace_role_id)
    .single()

  if (currentRole?.is_owner_role) {
    throw createError({ statusCode: 400, message: 'لا يمكن تغيير دور المالك' })
  }

  const { data: newRole } = await svc
    .from('workspace_roles')
    .select('id, is_owner_role')
    .eq('id', roleId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!newRole) {
    throw createError({ statusCode: 400, message: 'دور غير صالح' })
  }
  if (newRole.is_owner_role) {
    throw createError({ statusCode: 400, message: 'لا يمكن تعيين دور المالك يدوياً' })
  }

  const { error } = await svc
    .from('workspace_members')
    .update({ workspace_role_id: roleId })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
