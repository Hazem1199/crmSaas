// DELETE /api/[workspace]/campaigns/:id — حذف ناعم
import { requireWorkspacePermission } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'campaigns.manage')
  const id = getRouterParam(event, 'id')!
  const svc = useServiceRoleClient()

  const { data: existing, error: exErr } = await svc
    .from('campaigns')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (exErr) throw createError({ statusCode: 500, message: exErr.message })
  if (!existing) throw createError({ statusCode: 404, message: 'الحملة غير موجودة' })

  const { error: delAssign } = await svc
    .from('campaign_sales_assignments')
    .delete()
    .eq('campaign_id', id)

  if (delAssign) throw createError({ statusCode: 500, message: delAssign.message })

  const { error } = await svc
    .from('campaigns')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
