// DELETE /api/[workspace]/leads/[id]
// حذف ناعم (Soft Delete) - نقل للسلة
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const leadId = getRouterParam(event, 'id')!

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, message: 'تم نقل العميل إلى السلة' }
})
