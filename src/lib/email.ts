/**
 * Shared email sending utility using Resend.
 * Falls back to console logging in development.
 */

const FROM = "MyTime <notifications@updates.mytime.day>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[DEV] Email to ${to}: ${subject}`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    console.error(`Failed to send email to ${to}`);
    return false;
  }
}

/** Welcome email template */
export function welcomeEmailHtml(name: string | null): string {
  const displayName = name || "there";
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Welcome to MyTime!</h2>
      <p style="color: #666; line-height: 1.6;">
        Hey ${displayName}, thanks for signing up. You're all set to start managing your workday.
      </p>
      <p style="color: #666; line-height: 1.6;">Here's what to do first:</p>
      <ol style="color: #666; line-height: 1.8;">
        <li><strong>Add your clients</strong> with their weekly hour targets</li>
        <li><strong>Set your availability</strong> in Settings</li>
        <li><strong>Hit Generate</strong> to get your entire week in seconds</li>
      </ol>
      <p style="color: #666; line-height: 1.6;">
        If you need help, check the <strong>Knowledge Base</strong> in your sidebar or submit a support request.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #bbb; font-size: 11px;">MyTime &mdash; The workday manager for freelancers</p>
    </div>
  `;
}

/** Email verification template */
export function verificationEmailHtml(verifyUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Verify your email address</h2>
      <p style="color: #666; line-height: 1.6;">
        Thanks for signing up for MyTime! Click the button below to verify your email address.
      </p>
      <a href="${verifyUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #999; font-size: 13px; line-height: 1.5;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #bbb; font-size: 11px;">MyTime &mdash; The workday manager for freelancers</p>
    </div>
  `;
}
