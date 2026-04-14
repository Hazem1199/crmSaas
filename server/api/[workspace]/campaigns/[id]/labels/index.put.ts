// PUT /api/[workspace]/campaigns/:id/labels — استبدال مجموعة التصنيفات المربوطة بالحملة
import { requireWorkspacePermission } from '../../../../../utils/workspace-request'
import { assertCampaignInWorkspace } from '../../../../../utils/campaign-scope'
import { assertLabelsBelongToWorkspace } from '../../../../../utils/label-scope'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspacePermission(event, 'campaigns.manage')
  const campaignId = getRouterParam(event, 'id')!
  await assertCampaignInWorkspace(campaignId, workspaceId)

  const body = await readBody(event).catch(() => ({})) as { label_ids?: unknown }
  const raw = body.label_ids
  const label_ids = Array.isArray(raw)
    ? [...new Set(raw.filter((x): x is string => typeof x === 'string' && x.length > 0))]
    : []

  await assertLabelsBelongToWorkspace(label_ids, workspaceId)

  const svc = useServiceRoleClient()

  const { error: delErr } = await svc.from('campaign_labels').delete().eq('campaign_id', campaignId)
  if (delErr) throw createError({ statusCode: 500, message: delErr.message })

  if (label_ids.length) {
    const { error: insErr } = await svc.from('campaign_labels').insert(
      label_ids.map((label_id) => ({ campaign_id: campaignId, label_id })),
    )
    if (insErr) throw createError({ statusCode: 500, message: insErr.message })
  }

  const { data: links } = await svc.from('campaign_labels').select('label_id').eq('campaign_id', campaignId)
  const ids = [...new Set((links ?? []).map((r) => r.label_id as string))]
  if (!ids.length) return { data: [] }

  const { data, error } = await svc
    .from('labels')
    .select('id, workspace_id, name, color, created_at')
    .eq('workspace_id', workspaceId)
    .in('id', ids)
    .order('name')

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { data: data ?? [] }
})
