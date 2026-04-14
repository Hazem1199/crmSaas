// POST /api/invitations/accept — إكمال قبول الدعوة (كلمة المرور + الاسم)
export default defineEventHandler(async (event) => {
  const svc = useServiceRoleClient()
  await svc.rpc('expire_old_workspace_invitations')

  const body = await readBody(event).catch(() => ({})) as {
    invitation_id?: string
    token?: string
    full_name?: string
    password?: string
    password_confirm?: string
  }

  const invitationId = typeof body.invitation_id === 'string' ? body.invitation_id.trim() : ''
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const passwordConfirm = typeof body.password_confirm === 'string' ? body.password_confirm : ''

  if (!invitationId || !token) {
    throw createError({ statusCode: 400, message: 'معرّف الدعوة والرمز مطلوبان' })
  }
  if (!fullName) {
    throw createError({ statusCode: 400, message: 'الاسم الكامل مطلوب' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  }
  if (password !== passwordConfirm) {
    throw createError({ statusCode: 400, message: 'تأكيد كلمة المرور غير متطابق' })
  }

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
  if (inv.invitee_was_registered === true) {
    throw createError({
      statusCode: 400,
      message: 'هذه الدعوة لمستخدم مسجّل — سجّل الدخول بكلمة مرورك ثم استخدم «قبول الدعوة» من الصفحة.',
    })
  }
  if (inv.status !== 'pending') {
    throw createError({ statusCode: 400, message: 'هذه الدعوة لم تعد صالحة' })
  }
  if (new Date(inv.expires_at) < new Date()) {
    await svc.from('workspace_invitations').update({ status: 'expired' }).eq('id', inv.id)
    throw createError({ statusCode: 400, message: 'انتهت صلاحية الدعوة' })
  }

  const { data: userIdRaw, error: lookupErr } = await svc.rpc('lookup_auth_user_id_by_email', {
    p_email: inv.invitee_email,
  })

  if (lookupErr) {
    throw createError({ statusCode: 500, message: lookupErr.message })
  }

  const userId = userIdRaw as string | null
  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'لم يُنشَأ الحساب بعد. افتح الرابط من البريد الإلكتروني أولاً.',
    })
  }

  const { error: authErr } = await svc.auth.admin.updateUserById(userId, {
    password,
    user_metadata: { full_name: fullName },
  })
  if (authErr) {
    throw createError({ statusCode: 500, message: authErr.message })
  }

  const { error: profErr } = await svc
    .from('profiles')
    .upsert(
      { id: userId, full_name: fullName },
      { onConflict: 'id' },
    )
  if (profErr) {
    throw createError({ statusCode: 500, message: profErr.message })
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
