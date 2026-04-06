// POST /api/webhooks/facebook
// استقبال Leads من Facebook Lead Gen Ads
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // التحقق من صحة الـ Webhook عند الإعداد الأول
  if (query['hub.mode'] === 'subscribe') {
    const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN
    if (query['hub.verify_token'] !== verifyToken) {
      throw createError({ statusCode: 403, message: 'Invalid verify token' })
    }
    return query['hub.challenge']
  }

  const body = await readBody(event)
  const supabase = useServiceRoleClient()

  // معالجة كل Lead في الـ Payload
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change.field !== 'leadgen') continue

      const leadData = change.value
      const pageId = leadData?.page_id?.toString()

      // الحصول على workspace_id المرتبط بـ page_id
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .contains('settings', { facebook_page_id: pageId })
        .single()

      if (!ws) continue

      // الحصول على channel_id من نوع facebook
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('workspace_id', ws.id)
        .eq('type', 'facebook')
        .eq('is_active', true)
        .single()

      const fieldData = leadData?.field_data ?? []
      const getField = (name: string) =>
        fieldData.find((f: { name: string; values: string[] }) => f.name === name)?.values?.[0] ?? null

      await supabase.from('leads').insert({
        workspace_id: ws.id,
        full_name: getField('full_name') ?? getField('name') ?? 'Facebook Lead',
        email: getField('email'),
        phone: getField('phone_number'),
        channel_id: channel?.id ?? null,
        source_metadata: {
          facebook_lead_id: leadData?.leadgen_id,
          form_id: leadData?.form_id,
          page_id: pageId,
          raw: leadData,
        },
      })
    }
  }

  return { ok: true }
})
