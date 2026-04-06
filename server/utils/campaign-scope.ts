import { useServiceRoleClient } from './supabase'

export async function assertCampaignInWorkspace(
  campaignId: string,
  workspaceId: string
) {
  const svc = useServiceRoleClient()
  const { data, error } = await svc
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'الحملة غير موجودة' })
}
