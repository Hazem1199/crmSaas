import { useServiceRoleClient } from './supabase'
import type { MemberRole } from '~/types'

/**
 * استرجاع دور المستخدم في مساحة العمل
 */
export const getUserRole = async (
  userId: string,
  workspaceId: string
): Promise<MemberRole | null> => {
  const supabase = useServiceRoleClient()

  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  return (data?.role as MemberRole) ?? null
}

/**
 * التحقق من الصلاحية أو رفع خطأ 403
 */
export const requireRole = async (
  userId: string,
  workspaceId: string,
  allowedRoles: MemberRole[]
): Promise<MemberRole> => {
  const role = await getUserRole(userId, workspaceId)

  if (!role || !allowedRoles.includes(role)) {
    throw createError({
      statusCode: 403,
      message: 'ليس لديك صلاحية للقيام بهذا الإجراء',
    })
  }

  return role
}

/**
 * التحقق من عضوية المستخدم أو رفع 403
 */
export const requireMembership = async (
  userId: string,
  workspaceId: string
): Promise<MemberRole> => {
  return requireRole(userId, workspaceId, [
    'owner', 'admin', 'agent', 'reservation_manager',
  ])
}
