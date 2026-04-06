// GET /api/[workspace]/leads/trash
// السلة - العملاء المحذوفون
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const query = getQuery(event)

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const from = Number(query.from ?? 0)
  const to = Number(query.to ?? 19)

  const { data, error, count } = await supabase
    .from('leads')
    .select(
      `id, full_name, email, phone, deleted_at,
       status:statuses(id,name,color)`,
      { count: 'exact' }
    )
    .eq('workspace_id', workspaceId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .range(from, to)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data, total: count ?? 0 }
})
