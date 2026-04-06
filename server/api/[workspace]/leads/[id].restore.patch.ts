// PATCH /api/[workspace]/leads/[id]/restore
// استعادة العميل من السلة
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const leadId = getRouterParam(event, 'id')!

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: null })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId)
    .not('deleted_at', 'is', null)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, message: 'تم استعادة العميل بنجاح' }
})
