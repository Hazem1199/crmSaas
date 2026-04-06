// POST /api/[workspace]/leads
// إنشاء عميل محتمل جديد
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const body = await readBody(event)

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  const { full_name, email, phone, notes, status_id, channel_id,
          campaign_id, assigned_to, source_metadata } = body

  if (!full_name?.trim()) {
    throw createError({ statusCode: 400, message: 'الاسم الكامل مطلوب' })
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      full_name: full_name.trim(),
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      status_id: status_id || null,
      channel_id: channel_id || null,
      campaign_id: campaign_id || null,
      assigned_to: assigned_to || null,
      source_metadata: source_metadata || {},
    })
    .select(`*, status:statuses(id,name,color), channel:channels(id,name)`)
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data }
})
