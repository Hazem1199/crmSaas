// GET /api/[workspace]/roles/:roleId — تفاصيل دور + الصلاحيات الممنوحة
import { requireWorkspaceMember } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceMember(event)
  const roleId = getRouterParam(event, 'roleId')!
  const svc = useServiceRoleClient()

  const { data: role, error } = await svc
    .from('workspace_roles')
    .select('*')
    .eq('id', roleId)
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !role) {
    throw createError({ statusCode: 404, message: 'الدور غير موجود' })
  }

  const { data: perms } = await svc
    .from('workspace_role_permissions')
    .select('permission_key, granted')
    .eq('workspace_role_id', roleId)

  const grantedKeys = new Set(
    (perms ?? []).filter((p) => p.granted).map((p) => p.permission_key as string),
  )

  return {
    data: {
      ...role,
      permission_keys: [...grantedKeys],
    },
  }
})
