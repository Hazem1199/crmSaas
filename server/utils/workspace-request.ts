import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { getWorkspaceIdBySlug } from './supabase'
import { requireMembership, requireRole } from './permissions'
import type { MemberRole } from '~/types'

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

export async function requireWorkspaceAdmin(
  event: H3Event,
  allowedRoles: MemberRole[] = ['owner', 'admin'],
) {
  const ctx = await requireWorkspaceContext(event)
  await requireRole(ctx.user.id, ctx.workspaceId, allowedRoles)
  return ctx
}
