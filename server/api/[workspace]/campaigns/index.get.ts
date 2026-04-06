// GET /api/[workspace]/campaigns — قائمة الحملات + موظفي المبيعات المعيَّنين
import { requireWorkspaceMember } from '../../../utils/workspace-request'

export default defineEventHandler(async (event) => {
  const { workspaceId } = await requireWorkspaceMember(event)
  const svc = useServiceRoleClient()

  const { data: campaigns, error } = await svc
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  const list = campaigns ?? []
  const ids = list.map((c) => c.id)
  if (!ids.length) {
    return { data: [] }
  }

  const { data: assignRows, error: aErr } = await svc
    .from('campaign_sales_assignments')
    .select('id, workspace_id, campaign_id, user_id, created_at')
    .in('campaign_id', ids)

  if (aErr) throw createError({ statusCode: 500, message: aErr.message })

  const userIds = [...new Set((assignRows ?? []).map((r) => r.user_id))]
  let profMap: Record<string, { id: string; full_name: string | null; avatar_url: string | null }> = {}

  if (userIds.length) {
    const { data: profs, error: pErr } = await svc
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    if (pErr) throw createError({ statusCode: 500, message: pErr.message })
    profMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p]))
  }

  const byCampaign = new Map<string, typeof assignRows>()
  for (const row of assignRows ?? []) {
    const arr = byCampaign.get(row.campaign_id) ?? []
    arr.push(row)
    byCampaign.set(row.campaign_id, arr)
  }

  const { data: leadRows, error: lErr } = await svc
    .from('leads')
    .select('campaign_id')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .in('campaign_id', ids)

  if (lErr) throw createError({ statusCode: 500, message: lErr.message })

  const leadCountByCampaign = new Map<string, number>()
  for (const r of leadRows ?? []) {
    const cid = r.campaign_id as string | null
    if (!cid) continue
    leadCountByCampaign.set(cid, (leadCountByCampaign.get(cid) ?? 0) + 1)
  }

  const labelCountByCampaign = new Map<string, number>()
  const labelsPreviewByCampaign = new Map<string, { id: string; name: string; color: string }[]>()

  const { data: linkRowsFull, error: lbErr } = await svc
    .from('campaign_labels')
    .select('campaign_id, label_id')
    .in('campaign_id', ids)

  if (lbErr) {
    console.warn('[campaigns/index.get] label aggregates skipped:', lbErr.message)
  }
  else {
    const labelIds = [...new Set((linkRowsFull ?? []).map((r) => r.label_id as string))]
    const labelMeta = new Map<string, { id: string; name: string; color: string }>()
    if (labelIds.length) {
      const { data: lblRows, error: lblErr } = await svc
        .from('labels')
        .select('id, name, color')
        .eq('workspace_id', workspaceId)
        .in('id', labelIds)
      if (lblErr) {
        console.warn('[campaigns/index.get] labels meta skipped:', lblErr.message)
      }
      else {
        for (const l of lblRows ?? []) {
          labelMeta.set(l.id as string, {
            id: l.id as string,
            name: l.name as string,
            color: (l.color as string) || '#6B7280',
          })
        }
      }
    }

    for (const r of linkRowsFull ?? []) {
      const cid = r.campaign_id as string
      const lid = r.label_id as string
      if (!cid) continue
      labelCountByCampaign.set(cid, (labelCountByCampaign.get(cid) ?? 0) + 1)
      const meta = labelMeta.get(lid)
      if (!meta) continue
      const arr = labelsPreviewByCampaign.get(cid) ?? []
      arr.push(meta)
      labelsPreviewByCampaign.set(cid, arr)
    }

    for (const [cid, arr] of labelsPreviewByCampaign) {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
      labelsPreviewByCampaign.set(cid, arr.slice(0, 3))
    }
  }

  const data = list.map((c) => {
    const rows = byCampaign.get(c.id) ?? []
    const assignments = rows.map((r) => ({
      ...r,
      profile: profMap[r.user_id] ?? null,
    }))
    return {
      ...c,
      assignments,
      lead_count: leadCountByCampaign.get(c.id) ?? 0,
      label_count: labelCountByCampaign.get(c.id) ?? 0,
      labels_preview: labelsPreviewByCampaign.get(c.id) ?? [],
    }
  })

  return { data }
})
