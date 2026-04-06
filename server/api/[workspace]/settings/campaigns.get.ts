// GET /api/[workspace]/settings/campaigns
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('name')

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data }
})
