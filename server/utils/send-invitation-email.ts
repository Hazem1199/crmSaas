/**
 * إرسال رابط الدعوة عبر Resend (اختياري).
 * بدون RESEND_API_KEY لا يُرسل شيء — يعيد sent: false.
 */
export async function sendInviteLinkViaResend(options: {
  apiKey: string | undefined
  from: string | undefined
  to: string
  inviteUrl: string
  workspaceName: string | null
}): Promise<{ sent: boolean; error?: string }> {
  const { apiKey, from, to, inviteUrl, workspaceName } = options
  if (!apiKey?.trim() || !from?.trim()) {
    return { sent: false }
  }

  const subject = workspaceName
    ? `دعوة للانضمام إلى ${workspaceName}`
    : 'دعوة للانضمام إلى مساحة عمل'

  const html = `
    <p dir="rtl">مرحباً،</p>
    <p dir="rtl">لديك دعوة للانضمام إلى مساحة عمل${workspaceName ? ` «${escapeHtml(workspaceName)}»` : ''}.</p>
    <p dir="rtl"><a href="${escapeHtml(inviteUrl)}">اضغط هنا لقبول الدعوة وإكمال الانضمام</a></p>
    <p dir="rtl" style="color:#666;font-size:12px">إذا لم تطلب ذلك يمكنك تجاهل هذه الرسالة.</p>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from.trim(),
        to: [to.trim()],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { sent: false, error: text || res.statusText }
    }
    return { sent: true }
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { sent: false, error: msg }
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
