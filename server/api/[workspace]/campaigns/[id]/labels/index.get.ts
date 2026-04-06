// GET /api/[workspace]/campaigns/:id/labels — التصنيفات المربوطة بهذه الحملة
import { requireWorkspaceMember } from '../../../../../utils/workspace-request'
import { assertCampaignInWorkspace } from '../../../../../utils/campaign-scope'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceMember(event)
  const campaignId = getRouterParam(event, 'id')!
  await assertCampaignInWorkspace(campaignId, workspaceId)

  const svc = useServiceRoleClient()
  const { data: links, error: linkErr } = await svc
    .from('campaign_labels')
    .select('label_id')
    .eq('campaign_id', campaignId)

  if (linkErr) throw createError({ statusCode: 500, message: linkErr.message })

  const labelIds = [...new Set((links ?? []).map((r) => r.label_id as string))]
  if (!labelIds.length) {
    return { data: [] }
  }

  const { data, error } = await svc
    .from('labels')
    .select('id, workspace_id, name, color, created_at')
    .eq('workspace_id', workspaceId)
    .in('id', labelIds)
    .order('name')

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { data: data ?? [] }
})
