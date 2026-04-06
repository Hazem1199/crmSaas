// PUT /api/[workspace]/leads/[id]
// تعديل بيانات عميل محتمل
export default defineEventHandler(async (event) => {
  const workspaceSlug = getRouterParam(event, 'workspace')!
  const leadId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const workspaceId = await getWorkspaceIdBySlug(workspaceSlug)
  const supabase = useServiceRoleClient()

  // الحقول القابلة للتعديل
  const allowedFields = [
    'full_name', 'email', 'phone', 'notes',
    'status_id', 'channel_id', 'campaign_id', 'assigned_to',
  ]

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field] ?? null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'لا توجد بيانات للتحديث' })
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .select(`
      *,
      status:statuses(id,name,color),
      channel:channels(id,name),
      campaign:campaigns(id,name),
      assigned_agent:profiles!leads_assigned_to_fkey(id,full_name,avatar_url,phone)
    `)
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data }
})
