// PUT /api/[workspace]/campaigns/:id
import { requireWorkspaceAdmin } from '../../../utils/workspace-request'
import { replaceCampaignAssignments } from '../../../utils/campaign-assignments'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceAdmin(event)
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

  const body = await readBody(event).catch(() => ({})) as {
    name?: string
    description?: string | null
    is_active?: boolean
    starts_at?: string | null
    ends_at?: string | null
    landing_page_url?: string | null
    customer_service_script?: string | null
    assigned_user_ids?: string[]
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string') {
    const n = body.name.trim()
    if (!n) throw createError({ statusCode: 400, message: 'اسم الحملة مطلوب' })
    patch.name = n
  }
  if ('description' in body) patch.description = body.description
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active
  if ('starts_at' in body) patch.starts_at = body.starts_at
  if ('ends_at' in body) patch.ends_at = body.ends_at
  if ('landing_page_url' in body) {
    patch.landing_page_url = typeof body.landing_page_url === 'string'
      ? body.landing_page_url.trim() || null
      : body.landing_page_url
  }
  if ('customer_service_script' in body) {
    patch.customer_service_script = typeof body.customer_service_script === 'string'
      ? body.customer_service_script.trim() || null
      : body.customer_service_script
  }

  if (Object.keys(patch).length) {
    const { error: upErr } = await svc.from('campaigns').update(patch).eq('id', id)
    if (upErr) throw createError({ statusCode: 500, message: upErr.message })
  }

  if (Array.isArray(body.assigned_user_ids)) {
    await replaceCampaignAssignments(svc, workspaceId, id, body.assigned_user_ids)
  }

  const { data: row, error } = await svc.from('campaigns').select('*').eq('id', id).single()
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data: row }
})
