export async function assertWorkspaceMemberUserIds(
  svc: ReturnType<typeof useServiceRoleClient>,
  workspaceId: string,
  userIds: string[]
) {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (!unique.length) return

  const { data, error } = await svc
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .in('user_id', unique)

  if (error) throw createError({ statusCode: 500, message: error.message })
  if ((data?.length ?? 0) !== unique.length) {
    throw createError({
      statusCode: 400,
      message: 'أحد الموظفين المحددين ليس عضواً نشطاً في مساحة العمل',
    })
  }
}

export async function replaceCampaignAssignments(
  svc: ReturnType<typeof useServiceRoleClient>,
  workspaceId: string,
  campaignId: string,
  userIds: string[]
) {
  const unique = [...new Set(userIds.filter(Boolean))]
  await assertWorkspaceMemberUserIds(svc, workspaceId, unique)

  const { error: delErr } = await svc
    .from('campaign_sales_assignments')
    .delete()
    .eq('campaign_id', campaignId)

  if (delErr) throw createError({ statusCode: 500, message: delErr.message })

  if (!unique.length) return

  const { error: insErr } = await svc.from('campaign_sales_assignments').insert(
    unique.map((user_id) => ({
      workspace_id: workspaceId,
      campaign_id: campaignId,
      user_id,
    }))
  )

  if (insErr) throw createError({ statusCode: 500, message: insErr.message })
}
