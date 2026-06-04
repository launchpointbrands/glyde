"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export type InviteResult = { success: true } | { error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendInvitation(email: string): Promise<InviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to send invitations." };

  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed)) {
    return { error: "Enter a valid email address." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "Email service not configured." };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "WMGR <info@meetings.launchpointbrands.com>",
      to: trimmed,
      subject: "You're invited to WMGR",
      html: INVITE_HTML,
    });
    if (error) return { error: error.message ?? "Could not send invitation." };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not send invitation.";
    return { error: msg };
  }
}

const INVITE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to WMGR</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F6F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F6F4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo header — dark green panel -->
          <tr>
            <td style="background-color:#395E38;border-radius:12px 12px 0 0;padding:24px 40px;">
              <p style="margin:0;font-size:24px;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">WMGR</p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 12px 12px;border:1px solid #E8EDE8;border-top:none;padding:40px 40px 40px;">

              <!-- Eyebrow -->
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;color:#7A9A7A;letter-spacing:0.08em;text-transform:uppercase;">Private invitation</p>

              <!-- Headline -->
              <h1 style="margin:0 0 16px 0;font-size:26px;font-weight:400;color:#1A2E1A;line-height:1.25;">You're invited to review WMGR.</h1>

              <!-- Subhead -->
              <p style="margin:0 0 28px 0;font-size:15px;color:#4A6A4A;line-height:1.65;">We've been building something I think you'll find compelling — a platform designed specifically for wealth advisors working with business owner clients.</p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="height:1px;background-color:#E8EDE8;"></td></tr>
              </table>

              <!-- What it does -->
              <p style="margin:0 0 20px 0;font-size:11px;font-weight:600;color:#7A9A7A;letter-spacing:0.08em;text-transform:uppercase;">What WMGR does</p>

              <!-- Feature 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
                <tr>
                  <td width="28" valign="top" style="padding-top:1px;">
                    <div style="width:22px;height:22px;background-color:#F0F7F0;border-radius:5px;text-align:center;line-height:22px;font-size:13px;">📊</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1A2E1A;">Valuation, risk & succession reports</p>
                    <p style="margin:0;font-size:13px;color:#4A6A4A;line-height:1.55;">Instant valuation ranges, 8-factor risk assessments, and succession readiness scores — generated from a simple discovery conversation with your client.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
                <tr>
                  <td width="28" valign="top" style="padding-top:1px;">
                    <div style="width:22px;height:22px;background-color:#F0F7F0;border-radius:5px;text-align:center;line-height:22px;font-size:13px;">🗂️</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1A2E1A;">Prioritized advisor path</p>
                    <p style="margin:0;font-size:13px;color:#4A6A4A;line-height:1.55;">For each client, WMGR surfaces the highest-impact conversations to have — in priority order, based on their specific risk profile and exit timeline.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="28" valign="top" style="padding-top:1px;">
                    <div style="width:22px;height:22px;background-color:#F0F7F0;border-radius:5px;text-align:center;line-height:22px;font-size:13px;">✨</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1A2E1A;">Ask WMGR — AI advisor coaching</p>
                    <p style="margin:0;font-size:13px;color:#4A6A4A;line-height:1.55;">Before any client meeting, ask WMGR how to approach a specific conversation. It gives you a tailored opening line, context on why it matters for this client, and how to handle objections.</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="height:1px;background-color:#E8EDE8;"></td></tr>
              </table>

              <!-- Instructions -->
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;color:#7A9A7A;letter-spacing:0.08em;text-transform:uppercase;">Getting started</p>
              <p style="margin:0 0 28px 0;font-size:14px;color:#4A6A4A;line-height:1.65;">Create your account, then add a business owner client you work with — or explore with a built-in sample case. Setup takes under 3 minutes. The platform will guide you through the rest.</p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <a href="https://glyde-alpha.vercel.app/signup" style="display:inline-block;background-color:#395E38;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;padding:14px 40px;border-radius:8px;">Create your account →</a>
                  </td>
                </tr>
              </table>

              <!-- URL fallback -->
              <p style="margin:0 0 32px;font-size:12px;color:#7A9A7A;text-align:center;">glyde-alpha.vercel.app/signup</p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="height:1px;background-color:#E8EDE8;"></td></tr>
              </table>

              <!-- Personal note -->
              <p style="margin:0;font-size:13px;color:#7A9A7A;line-height:1.65;">This is an early preview — your reaction means a lot. Happy to walk through it together once you've had a chance to explore on your own.</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;padding-bottom:8px;">
              <p style="margin:0;font-size:11px;color:#7A9A7A;letter-spacing:0.03em;">WMGR &nbsp;·&nbsp; Built for advisors &nbsp;·&nbsp; Distributed through firms</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
