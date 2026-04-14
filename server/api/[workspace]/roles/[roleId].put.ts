// PUT /api/[workspace]/roles/:roleId — تحديث اسم الدور والأعلام ومجموعة الصلاحيات
import { requireWorkspacePermission } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'roles.manage')
  const roleId = getRouterParam(event, 'roleId')!
  const body = await readBody(event).catch(() => ({})) as {
    name?: string
    is_default_invite_role?: boolean
    distribute_customers_to_role?: boolean
    permission_keys?: string[]
  }

  const svc = useServiceRoleClient()

  const { data: existing, error: exErr } = await svc
    .from('workspace_roles')
    .select('id, is_owner_role, slug')
    .eq('id', roleId)
    .eq('workspace_id', workspaceId)
    .single()

  if (exErr || !existing) {
    throw createError({ statusCode: 404, message: 'الدور غير موجود' })
  }
  if (existing.is_owner_role) {
    throw createError({ statusCode: 400, message: 'لا يمكن تعديل دور المالك' })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) {
    patch.name = body.name.trim()
  }
  if (typeof body.is_default_invite_role === 'boolean') {
    patch.is_default_invite_role = body.is_default_invite_role
  }
  if (typeof body.distribute_customers_to_role === 'boolean') {
    patch.distribute_customers_to_role = body.distribute_customers_to_role
  }

  if (Object.keys(patch).length) {
    const { error: upErr } = await svc.from('workspace_roles').update(patch).eq('id', roleId)
    if (upErr) throw createError({ statusCode: 500, message: upErr.message })
  }

  if (body.is_default_invite_role === true) {
    await svc
      .from('workspace_roles')
      .update({ is_default_invite_role: false })
      .eq('workspace_id', workspaceId)
      .neq('id', roleId)
  }

  if (Array.isArray(body.permission_keys)) {
    await svc.from('workspace_role_permissions').delete().eq('workspace_role_id', roleId)

    const keys = [...new Set(body.permission_keys.filter((k) => typeof k === 'string' && k))]
    if (keys.length) {
      const rows = keys.map((permission_key) => ({
        workspace_role_id: roleId,
        permission_key,
        granted: true,
      }))
      const { error: insErr } = await svc.from('workspace_role_permissions').insert(rows)
      if (insErr) throw createError({ statusCode: 500, message: insErr.message })
    }
  }

  return { ok: true }
})
