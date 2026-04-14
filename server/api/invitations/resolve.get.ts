// GET /api/invitations/resolve — معاينة دعوة (عام، بالمعرّف + الرمز السري)
export default defineEventHandler(async (event) => {
  const svc = useServiceRoleClient()
  await svc.rpc('expire_old_workspace_invitations')

  const q = getQuery(event)
  const invitationId = typeof q.invitation_id === 'string' ? q.invitation_id.trim() : ''
  const token = typeof q.token === 'string' ? q.token.trim() : ''

  if (!invitationId || !token) {
    throw createError({ statusCode: 400, message: 'معرّف الدعوة والرمز مطلوبان' })
  }

  const { data: inv, error } = await svc
    .from('workspace_invitations')
    .select(`
      id,
      invitee_email,
      status,
      expires_at,
      workspace_id,
      invitee_was_registered,
      workspaces ( name, slug )
    `)
    .eq('id', invitationId)
    .eq('token', token)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  if (!inv) {
    throw createError({ statusCode: 404, message: 'دعوة غير موجودة' })
  }

  if (inv.status !== 'pending') {
    return {
      valid: false,
      status: inv.status,
      invitee_email: inv.invitee_email,
      invitee_has_account: Boolean((inv as { invitee_was_registered?: boolean }).invitee_was_registered),
      workspace_name: null as string | null,
      workspace_slug: null as string | null,
    }
  }

  if (new Date(inv.expires_at) < new Date()) {
    await svc
      .from('workspace_invitations')
      .update({ status: 'expired' })
      .eq('id', inv.id)

    return {
      valid: false,
      status: 'expired' as const,
      invitee_email: inv.invitee_email,
      invitee_has_account: Boolean((inv as { invitee_was_registered?: boolean }).invitee_was_registered),
      workspace_name: null,
      workspace_slug: null,
    }
  }

  const ws = inv.workspaces as { name: string; slug: string } | { name: string; slug: string }[] | null
  const w = Array.isArray(ws) ? ws[0] : ws

  const registered = (inv as { invitee_was_registered?: boolean }).invitee_was_registered

  return {
    valid: true,
    status: 'pending' as const,
    invitee_email: inv.invitee_email,
    /** true إذا كان البريد مسجّلاً وقت إنشاء الدعوة (قبل القبول) */
    invitee_has_account: registered === true,
    workspace_name: w?.name ?? null,
    workspace_slug: w?.slug ?? null,
    expires_at: inv.expires_at,
  }
})
