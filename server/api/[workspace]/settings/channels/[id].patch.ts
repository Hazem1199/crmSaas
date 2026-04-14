// PATCH /api/[workspace]/settings/channels/:id
import { requireWorkspacePermission } from '../../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'settings.edit_channels')
  const id = getRouterParam(event, 'id')!
  const svc = useServiceRoleClient()

  const { data: existing, error: exErr } = await svc
    .from('channels')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (exErr) throw createError({ statusCode: 500, message: exErr.message })
  if (!existing) throw createError({ statusCode: 404, message: 'القناة غير موجودة' })

  const body = await readBody(event).catch(() => ({})) as { is_active?: boolean }
  const patch: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, message: 'لا يوجد حقول للتحديث' })
  }

  const { data, error } = await svc.from('channels').update(patch).eq('id', id).select('*').single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { data }
})
