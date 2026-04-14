// POST /api/[workspace]/campaigns
import { requireWorkspacePermission } from '../../../utils/workspace-request'
import { replaceCampaignAssignments } from '../../../utils/campaign-assignments'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'campaigns.manage')
  const svc = useServiceRoleClient()
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

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, message: 'اسم الحملة مطلوب' })
  }

  const assigned = Array.isArray(body.assigned_user_ids) ? body.assigned_user_ids : []

  const { data: row, error } = await svc
    .from('campaigns')
    .insert({
      workspace_id: workspaceId,
      name,
      description: body.description ?? null,
      is_active: body.is_active !== false,
      starts_at: body.starts_at ?? null,
      ends_at: body.ends_at ?? null,
      landing_page_url: body.landing_page_url?.trim() || null,
      customer_service_script: body.customer_service_script?.trim() || null,
    })
    .select('*')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await replaceCampaignAssignments(svc, workspaceId, row.id, assigned)

  return { data: row }
})
