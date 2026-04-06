// GET /api/[workspace]/leads
// قائمة العملاء المحتملين مع فلاتر وـ pagination
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const query = getQuery(event)

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  let dbQuery = supabase
    .from('leads')
    .select(
      `id, full_name, email, phone, notes, created_at, updated_at,
       status:statuses(id,name,color),
       channel:channels(id,name),
       campaign:campaigns(id,name),
       assigned_agent:profiles!leads_assigned_to_fkey(id,full_name,avatar_url)`,
      { count: 'exact' }
    )
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  // Filters
  if (query.status_id)   dbQuery = dbQuery.eq('status_id', query.status_id as string)
  if (query.channel_id)  dbQuery = dbQuery.eq('channel_id', query.channel_id as string)
  if (query.campaign_id) dbQuery = dbQuery.eq('campaign_id', query.campaign_id as string)
  if (query.assigned_to) dbQuery = dbQuery.eq('assigned_to', query.assigned_to as string)
  if (query.date_from)   dbQuery = dbQuery.gte('created_at', query.date_from as string)
  if (query.date_to)     dbQuery = dbQuery.lte('created_at', query.date_to as string)
  if (query.search) {
    const s = query.search as string
    dbQuery = dbQuery.or(
      `full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`
    )
  }

  const from = Number(query.from ?? 0)
  const to = Number(query.to ?? 19)

  const { data, error, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data, total: count ?? 0 }
})
