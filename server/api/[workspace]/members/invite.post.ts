// POST /api/[workspace]/members/invite — دعوة عضو (team.manage) — دائماً pending حتى القبول
import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { requireWorkspacePermission } from '../../../utils/workspace-request'
import { sendInviteLinkViaResend } from '../../../utils/send-invitation-email'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getPublicSiteUrl(event: H3Event) {
  const config = useRuntimeConfig(event)
  const fromEnv = (config.public.siteUrl as string | undefined)?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  try {
    return getRequestURL(event).origin
  }
  catch {
    return ''
  }
}

export default defineEventHandler(async (event) => {
  const { workspaceId, user } = await requireWorkspacePermission(event, 'team.manage')
  const svc = useServiceRoleClient()
  const runtime = useRuntimeConfig(event)

  await svc.rpc('expire_old_workspace_invitations')

  const body = await readBody(event).catch(() => ({})) as {
    email?: string
    workspace_role_id?: string
  }

  const emailRaw = typeof body.email === 'string' ? body.email : ''
  const email = normalizeEmail(emailRaw)
  if (!email || !isValidEmail(email)) {
    throw createError({ statusCode: 400, message: 'بريد إلكتروني غير صالح' })
  }

  let workspaceRoleId = typeof body.workspace_role_id === 'string' ? body.workspace_role_id.trim() : ''
  if (workspaceRoleId) {
    const { data: roleOk } = await svc
      .from('workspace_roles')
      .select('id, is_owner_role')
      .eq('workspace_id', workspaceId)
      .eq('id', workspaceRoleId)
      .maybeSingle()
    if (!roleOk || roleOk.is_owner_role) {
      throw createError({ statusCode: 400, message: 'دور غير صالح للدعوة' })
    }
  }
  else {
    const { data: defRole } = await svc
      .from('workspace_roles')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('is_default_invite_role', true)
      .maybeSingle()

    if (defRole?.id) {
      workspaceRoleId = defRole.id
    }
    else {
      const { data: agentRole } = await svc
        .from('workspace_roles')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('slug', 'agent')
        .maybeSingle()
      if (!agentRole) {
        throw createError({ statusCode: 500, message: 'لم يُعثر على دور افتراضي للدعوة' })
      }
      workspaceRoleId = agentRole.id
    }
  }

  const { data: existingUid, error: rpcErr } = await svc.rpc('lookup_auth_user_id_by_email', {
    p_email: email,
  })

  if (rpcErr) {
    throw createError({ statusCode: 500, message: rpcErr.message })
  }

  const uid = (existingUid as string | null) ?? null

  if (uid) {
    const { data: mem } = await svc
      .from('workspace_members')
      .select('id, is_active')
      .eq('workspace_id', workspaceId)
      .eq('user_id', uid)
      .maybeSingle()

    if (mem?.is_active) {
      throw createError({ statusCode: 409, message: 'هذا المستخدم عضو فعّال في المساحة بالفعل' })
    }
  }

  const token = randomBytes(32).toString('hex')

  const insertPayload: Record<string, unknown> = {
    workspace_id: workspaceId,
    workspace_role_id: workspaceRoleId,
    invitee_email: email,
    token,
    status: 'pending',
    invited_by: user.id,
    invitee_was_registered: !!uid,
  }

  const { data: inv, error: invErr } = await svc
    .from('workspace_invitations')
    .insert(insertPayload)
    .select('id')
    .single()

  if (invErr) {
    if (invErr.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'توجد دعوة معلّقة لهذا البريد في هذه المساحة',
      })
    }
    if (invErr.message?.includes('invitee_was_registered')) {
      throw createError({
        statusCode: 500,
        message: 'يُرجى تطبيق migration 012 على قاعدة البيانات (عمود invitee_was_registered).',
      })
    }
    throw createError({ statusCode: 500, message: invErr.message })
  }

  if (!inv?.id) {
    throw createError({ statusCode: 500, message: 'فشل إنشاء الدعوة' })
  }

  const baseUrl = getPublicSiteUrl(event)
  if (!baseUrl) {
    await svc.from('workspace_invitations').delete().eq('id', inv.id)
    throw createError({
      statusCode: 500,
      message: 'يُرجى ضبط NUXT_PUBLIC_SITE_URL لإرسال رابط قبول الدعوة',
    })
  }

  const acceptUrl = `${baseUrl}/auth/accept-invite?invitation_id=${inv.id}&token=${encodeURIComponent(token)}`

  const { data: wsRow } = await svc
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .maybeSingle()
  const workspaceName = wsRow?.name ?? null

  let emailSent = false

  if (!uid) {
    const { error: mailErr } = await svc.auth.admin.inviteUserByEmail(email, {
      redirectTo: acceptUrl,
      data: {
        invitation_id: inv.id,
      },
    })

    if (mailErr) {
      const resend = await sendInviteLinkViaResend({
        apiKey: runtime.resendApiKey as string | undefined,
        from: runtime.emailFrom as string | undefined,
        to: email,
        inviteUrl: acceptUrl,
        workspaceName,
      })
      if (resend.sent) {
        emailSent = true
      }
      else {
        return {
          mode: 'invite_pending' as const,
          invitation_id: inv.id,
          email_sent: false,
          invite_link: acceptUrl,
          invitee_was_registered: false,
          hint:
            'تعذر إرسال البريد عبر Supabase. انسخ الرابط وأرسله للمدعو يدوياً، أو اضبط RESEND_API_KEY و EMAIL_FROM.',
        }
      }
    }
    else {
      emailSent = true
    }

    return {
      mode: 'invite_email_sent' as const,
      invitation_id: inv.id,
      email_sent: emailSent,
      invitee_was_registered: false,
    }
  }

  const resend = await sendInviteLinkViaResend({
    apiKey: runtime.resendApiKey as string | undefined,
    from: runtime.emailFrom as string | undefined,
    to: email,
    inviteUrl: acceptUrl,
    workspaceName,
  })

  if (resend.sent) {
    return {
      mode: 'invite_email_sent' as const,
      invitation_id: inv.id,
      email_sent: true,
      invitee_was_registered: true,
    }
  }

  return {
    mode: 'invite_pending' as const,
    invitation_id: inv.id,
    email_sent: false,
    invite_link: acceptUrl,
    invitee_was_registered: true,
    hint:
      resend.error
        ? `تعذر الإرسال عبر Resend: ${resend.error}. انسخ الرابط يدوياً أو راجع الإعدادات.`
        : 'لم يُضبط RESEND_API_KEY أو EMAIL_FROM — انسخ الرابط وأرسله للمدعو يدوياً.',
  }
})
