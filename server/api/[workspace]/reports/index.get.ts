// GET /api/[workspace]/reports
// التقارير مع فلاتر متقدمة
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const query = getQuery(event)

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  // ملخص الحالات
  let leadsQuery = supabase
    .from('leads')
    .select('id, status_id, channel_id, campaign_id, assigned_to, created_at')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if (query.date_from)   leadsQuery = leadsQuery.gte('created_at', query.date_from as string)
  if (query.date_to)     leadsQuery = leadsQuery.lte('created_at', query.date_to as string)
  if (query.status_id)   leadsQuery = leadsQuery.eq('status_id', query.status_id as string)
  if (query.channel_id)  leadsQuery = leadsQuery.eq('channel_id', query.channel_id as string)
  if (query.campaign_id) leadsQuery = leadsQuery.eq('campaign_id', query.campaign_id as string)
  if (query.assigned_to) leadsQuery = leadsQuery.eq('assigned_to', query.assigned_to as string)

  const { data: leads, error } = await leadsQuery

  if (error) throw createError({ statusCode: 500, message: error.message })

  // إحصائيات التجميع
  const byStatus: Record<string, number> = {}
  const byChannel: Record<string, number> = {}
  const byCampaign: Record<string, number> = {}
  const byAgent: Record<string, number> = {}

  for (const lead of leads ?? []) {
    if (lead.status_id)   byStatus[lead.status_id] = (byStatus[lead.status_id] ?? 0) + 1
    if (lead.channel_id)  byChannel[lead.channel_id] = (byChannel[lead.channel_id] ?? 0) + 1
    if (lead.campaign_id) byCampaign[lead.campaign_id] = (byCampaign[lead.campaign_id] ?? 0) + 1
    if (lead.assigned_to) byAgent[lead.assigned_to] = (byAgent[lead.assigned_to] ?? 0) + 1
  }

  return {
    total: leads?.length ?? 0,
    byStatus,
    byChannel,
    byCampaign,
    byAgent,
  }
})
