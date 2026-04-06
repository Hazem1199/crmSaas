// GET /api/[workspace]/settings/statuses
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('statuses')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sort_order')

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data }
})
