import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { getWorkspaceIdBySlug } from './supabase'
import { requireMembership, requirePermission } from './permissions'

/**
 * مستخدم مسجّل + workspace_id من الـ slug في المسار
 */
export async function requireWorkspaceContext(event: H3Event) {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) {
    throw createError({ statusCode: 401, message: 'يجب تسجيل الدخول' })
  }
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  return { user, workspaceId, workspaceSlug }
}

export async function requireWorkspaceMember(event: H3Event) {
  const ctx = await requireWorkspaceContext(event)
  await requireMembership(ctx.user.id, ctx.workspaceId)
  return ctx
}

/**
 * التحقق من صلاحية محددة في مساحة العمل (مفاتيح permission_definitions)
 */
export async function requireWorkspacePermission(event: H3Event, permissionKey: string) {
  const ctx = await requireWorkspaceContext(event)
  await requirePermission(ctx.user.id, ctx.workspaceId, permissionKey)
  return ctx
}

/** @deprecated استخدم requireWorkspacePermission مع المفتاح المناسب (مثل campaigns.manage) */
export async function requireWorkspaceAdmin(event: H3Event) {
  return requireWorkspacePermission(event, 'workspace.manage_settings')
}
