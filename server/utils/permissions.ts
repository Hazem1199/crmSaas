import { useServiceRoleClient } from './supabase'

/**
 * قائمة مفاتيح الصلاحيات الفعّالة للمستخدم في مساحة العمل
 */
export async function getUserPermissionKeys(
  userId: string,
  workspaceId: string,
): Promise<Set<string>> {
  const svc = useServiceRoleClient()

  const { data: row, error } = await svc
    .from('workspace_members')
    .select('workspace_role_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !row?.workspace_role_id) return new Set()

  const { data: roleRow } = await svc
    .from('workspace_roles')
    .select('is_owner_role')
    .eq('id', row.workspace_role_id)
    .single()

  if (roleRow?.is_owner_role) {
    const { data: all } = await svc.from('permission_definitions').select('key')
    return new Set((all ?? []).map((r) => r.key as string))
  }

  const { data: perms } = await svc
    .from('workspace_role_permissions')
    .select('permission_key')
    .eq('workspace_role_id', row.workspace_role_id)
    .eq('granted', true)

  return new Set((perms ?? []).map((p) => p.permission_key as string))
}

export async function getUserRoleSlug(
  userId: string,
  workspaceId: string,
): Promise<string | null> {
  const svc = useServiceRoleClient()
  const { data: m } = await svc
    .from('workspace_members')
    .select('workspace_role_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (!m?.workspace_role_id) return null

  const { data: r } = await svc
    .from('workspace_roles')
    .select('slug')
    .eq('id', m.workspace_role_id)
    .single()

  return r?.slug ?? null
}

/**
 * التحقق من صلاحية أو 403
 */
export async function requirePermission(
  userId: string,
  workspaceId: string,
  permissionKey: string,
): Promise<void> {
  const keys = await getUserPermissionKeys(userId, workspaceId)
  if (!keys.has(permissionKey)) {
    throw createError({
      statusCode: 403,
      message: 'ليس لديك صلاحية للقيام بهذا الإجراء',
    })
  }
}

/**
 * التحقق من عضوية المستخدم
 */
export async function requireMembership(
  userId: string,
  workspaceId: string,
): Promise<void> {
  const svc = useServiceRoleClient()
  const { data } = await svc
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) {
    throw createError({
      statusCode: 403,
      message: 'ليس لديك صلاحية للقيام بهذا الإجراء',
    })
  }
}
