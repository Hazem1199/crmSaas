// POST /api/invitations/accept-existing — قبول دعوة لمستخدم كان مسجّلاً وقت إنشاء الدعوة (يتطلب جلسة)
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authErr } = await client.auth.getUser()

  if (authErr || !user?.email) {
    throw createError({
      statusCode: 401,
      message: 'يجب تسجيل الدخول بالبريد المدعو لقبول الدعوة',
    })
  }

  const body = await readBody(event).catch(() => ({})) as {
    invitation_id?: string
    token?: string
  }

  const invitationId = typeof body.invitation_id === 'string' ? body.invitation_id.trim() : ''
  const token = typeof body.token === 'string' ? body.token.trim() : ''

  if (!invitationId || !token) {
    throw createError({ statusCode: 400, message: 'معرّف الدعوة والرمز مطلوبان' })
  }

  const svc = useServiceRoleClient()
  await svc.rpc('expire_old_workspace_invitations')

  const { data: inv, error: invErr } = await svc
    .from('workspace_invitations')
    .select('id, workspace_id, workspace_role_id, invitee_email, status, expires_at, invited_by, token, invitee_was_registered')
    .eq('id', invitationId)
    .eq('token', token)
    .maybeSingle()

  if (invErr) {
    throw createError({ statusCode: 500, message: invErr.message })
  }
  if (!inv) {
    throw createError({ statusCode: 404, message: 'دعوة غير موجودة' })
  }
  if (inv.invitee_was_registered !== true) {
    throw createError({
      statusCode: 400,
      message: 'هذه الدعوة لحساب جديد — أكمل النموذج الكامل في صفحة قبول الدعوة.',
    })
  }
  if (inv.status !== 'pending') {
    throw createError({ statusCode: 400, message: 'هذه الدعوة لم تعد صالحة' })
  }
  if (new Date(inv.expires_at) < new Date()) {
    await svc.from('workspace_invitations').update({ status: 'expired' }).eq('id', inv.id)
    throw createError({ statusCode: 400, message: 'انتهت صلاحية الدعوة' })
  }

  const emailUser = user.email.toLowerCase().trim()
  const emailInv = inv.invitee_email.toLowerCase().trim()
  if (emailUser !== emailInv) {
    throw createError({
      statusCode: 403,
      message: 'يجب تسجيل الدخول بنفس البريد المدعو.',
    })
  }

  const { data: userIdRaw } = await svc.rpc('lookup_auth_user_id_by_email', {
    p_email: inv.invitee_email,
  })
  const userId = userIdRaw as string | null
  if (!userId || userId !== user.id) {
    throw createError({ statusCode: 403, message: 'تعارض في حساب المستخدم' })
  }

  const { data: existingMem } = await svc
    .from('workspace_members')
    .select('id, is_active')
    .eq('workspace_id', inv.workspace_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingMem) {
    const { error: memUp } = await svc
      .from('workspace_members')
      .update({
        is_active: true,
        workspace_role_id: inv.workspace_role_id,
      })
      .eq('id', existingMem.id)
    if (memUp) throw createError({ statusCode: 500, message: memUp.message })
  }
  else {
    const { error: memIn } = await svc.from('workspace_members').insert({
      workspace_id: inv.workspace_id,
      user_id: userId,
      workspace_role_id: inv.workspace_role_id,
      is_active: true,
      invited_by: inv.invited_by,
    })
    if (memIn) throw createError({ statusCode: 500, message: memIn.message })
  }

  const { error: doneErr } = await svc
    .from('workspace_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
    })
    .eq('id', inv.id)

  if (doneErr) {
    throw createError({ statusCode: 500, message: doneErr.message })
  }

  const { data: ws } = await svc
    .from('workspaces')
    .select('slug')
    .eq('id', inv.workspace_id)
    .maybeSingle()

  return {
    ok: true,
    workspace_slug: ws?.slug ?? null,
  }
})
