// GET /api/[workspace]/leads/[id]
// تفاصيل عميل محتمل واحد
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const leadId = getRouterParam(event, 'id')!

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      status:statuses(id,name,color),
      channel:channels(id,name),
      campaign:campaigns(id,name),
      assigned_agent:profiles!leads_assigned_to_fkey(id,full_name,avatar_url,phone),
      lead_notes(id,content,created_at,profile:profiles!lead_notes_created_by_fkey(id,full_name,avatar_url)),
      lead_attachments(id,file_name,file_url,file_size,mime_type,created_at)
    `)
    .eq('id', leadId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .single()

  if (error) throw createError({ statusCode: 404, message: 'العميل غير موجود' })

  return { data }
})
