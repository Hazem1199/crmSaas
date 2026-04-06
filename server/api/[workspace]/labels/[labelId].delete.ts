// DELETE /api/[workspace]/labels/:labelId — حذف التصنيف من المساحة (وكل روابطه بالحملات)
import { requireWorkspaceAdmin } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceAdmin(event)
  const labelId = getRouterParam(event, 'labelId')!
  const svc = useServiceRoleClient()

  const { data: existing, error: exErr } = await svc
    .from('labels')
    .select('id')
    .eq('id', labelId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (exErr) throw createError({ statusCode: 500, message: exErr.message })
  if (!existing) throw createError({ statusCode: 404, message: 'التصنيف غير موجود' })

  const { error } = await svc.from('labels').delete().eq('id', labelId)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
