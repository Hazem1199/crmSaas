// GET /api/[workspace]/settings/channels
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data }
})
