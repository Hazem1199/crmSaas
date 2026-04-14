// GET /api/[workspace]/permissions/me — الصلاحيات الفعّالة للمستخدم الحالي
import { requireWorkspaceMember } from '../../../utils/workspace-request'
import { getUserPermissionKeys, getUserRoleSlug } from '../../../utils/permissions'

export default defineEventHandler(async (event) => {
  const { user, workspaceId } = await requireWorkspaceMember(event)
  const [permissions, roleSlug] = await Promise.all([
    getUserPermissionKeys(user.id, workspaceId),
    getUserRoleSlug(user.id, workspaceId),
  ])

  return {
    permissions: [...permissions],
    role_slug: roleSlug,
  }
})
