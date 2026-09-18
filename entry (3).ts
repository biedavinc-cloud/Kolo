const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Envoie une invitation par email pour rejoindre un foyer Liyah.
// Payload: { to, householdName, inviteCode }
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const to = (body.to || '').trim();
    const householdName = (body.householdName || 'notre foyer').trim();
    const inviteCode = (body.inviteCode || '').trim();

    if (!to || !inviteCode) {
      return Response.json({ error: 'Destinataire et code requis' }, { status: 400 });
    }

    const joinUrl = `${new URL(req.url).origin}/onboarding?code=${encodeURIComponent(inviteCode)}`;
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #202223;">
        <h2 style="color:#008060;">Invitation Liyah</h2>
        <p>${user.full_name || user.email} vous invite à rejoindre le foyer <strong>${householdName}</strong> sur Liyah.</p>
        <p>Liyah est une application familiale de gestion financière partagée.</p>
        <p style="margin-top:24px;">
          <a href="${joinUrl}" style="background:#008060;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;font-weight:600;">Rejoindre le foyer</a>
        </p>
        <p style="margin-top:16px;font-size:13px;color:#6D7175;">Ou utilisez ce code d'invitation : <code style="background:#F6F6F7;padding:2px 6px;border-radius:4px;">${inviteCode}</code></p>
        <p style="margin-top:24px;font-size:12px;color:#6D7175;">Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
      </div>`;

    await db.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: `${user.full_name || user.email} vous invite à rejoindre ${householdName} sur Liyah`,
      html,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}