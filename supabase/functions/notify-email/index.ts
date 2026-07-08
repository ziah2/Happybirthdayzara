// Supabase Edge Function: transactional email via Resend.
// Deploy with:  supabase functions deploy notify-email
// Configure:    supabase secrets set RESEND_API_KEY=... EMAIL_FROM="Student Hub <no-reply@yourdomain>"
//
// Invoked from the app (best-effort) for contributor approval/rejection, and
// can be reused for verification / password reset / welcome emails.
//
// deno-lint-ignore-file
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Student Hub <onboarding@resend.dev>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TEMPLATES: Record<string, (reason?: string) => { subject: string; html: string }> = {
  contributor_approved: () => ({
    subject: 'Contributor Application Approved',
    html: `<p>Congratulations! Your contributor application has been approved. You can now upload lecture notes, past questions, and publish department or faculty news.</p>`,
  }),
  contributor_rejected: (reason?: string) => ({
    subject: 'Contributor Application Update',
    html: `<p>Your contributor application was not approved at this time. Reason: ${reason || 'Not specified'}. You may apply again after 30 days.</p>`,
  }),
};

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { kind, to, reason } = await req.json();
    const template = TEMPLATES[kind];
    if (!template) return new Response(JSON.stringify({ error: 'unknown kind' }), { status: 400 });

    // Resolve recipient email from the user id.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: user } = await admin.from('users').select('email').eq('id', to).maybeSingle();
    const email = user?.email;
    if (!email) return new Response(JSON.stringify({ error: 'no email' }), { status: 404 });

    if (!RESEND_API_KEY) {
      // No key configured — treat as a no-op so the app flow still succeeds.
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const { subject, html } = template(reason);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [email], subject, html }),
    });
    const body = await res.json();
    return new Response(JSON.stringify(body), { status: res.ok ? 200 : 500 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
