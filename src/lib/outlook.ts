import { prisma } from "@/lib/db";

const GRAPH_API = "https://graph.microsoft.com/v1.0";

export const OUTLOOK_SCOPES = [
  "openid",
  "email",
  "offline_access",
  "Mail.Read",
  "Mail.Send",
  "Mail.ReadWrite",
].join(" ");

// ─── OAuth helpers ─────────────────────────────────────────

export async function exchangeMicrosoftCode(code: string, redirectUri: string) {
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: OUTLOOK_SCOPES,
    }),
  });
  return res.json();
}

export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: OUTLOOK_SCOPES,
    }),
  });
  return res.json();
}

export async function getValidOutlookToken(accountId: string): Promise<string> {
  const account = await prisma.outlookAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Outlook account not found");

  const now = Math.floor(Date.now() / 1000);

  // Return existing token if still valid (with 5 min buffer)
  if (account.expiresAt && account.expiresAt > now + 300) {
    return account.accessToken;
  }

  // Refresh the token
  const data = await refreshMicrosoftToken(account.refreshToken);
  if (!data.access_token) throw new Error("Failed to refresh Outlook token");

  const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

  await prisma.outlookAccount.update({
    where: { id: accountId },
    data: {
      accessToken: data.access_token,
      expiresAt,
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    },
  });

  return data.access_token;
}

// ─── Graph API helpers ──────────────────────────────────────

async function graphGet(path: string, token: string) {
  const res = await fetch(`${GRAPH_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getUserEmail(token: string): Promise<string> {
  const data = await graphGet("/me", token);
  return data.mail || data.userPrincipalName || "";
}

export interface OutlookMessage {
  id: string;
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  toRecipients: { emailAddress: { name: string; address: string } }[];
  receivedDateTime: string;
  bodyPreview: string;
  body: { contentType: string; content: string };
  isRead: boolean;
  conversationId: string;
  webLink: string;
}

export interface OutlookListResult {
  value: OutlookMessage[];
  "@odata.nextLink"?: string;
}

export async function listMessages(
  token: string,
  query?: string,
  top = 30,
  skip = 0
): Promise<OutlookListResult> {
  let path = `/me/mailFolders/inbox/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,isRead,conversationId,webLink`;
  if (query) {
    // Escape single quotes for OData filter string
    const escaped = query.replace(/'/g, "''");
    path += `&$filter=contains(subject,'${escaped}') or contains(from/emailAddress/address,'${escaped}')`;
  }
  return graphGet(path, token);
}

export async function getMessage(token: string, messageId: string): Promise<OutlookMessage> {
  return graphGet(`/me/messages/${messageId}`, token);
}

export async function archiveMessage(token: string, messageId: string) {
  const res = await fetch(`${GRAPH_API}/me/messages/${messageId}/move`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ destinationId: "archive" }),
  });
  if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
  return res.json();
}

export async function sendOutlookEmail(
  token: string,
  to: string,
  subject: string,
  body: string,
  replyToMessageId?: string
) {
  if (replyToMessageId) {
    // Reply to existing message
    const res = await fetch(`${GRAPH_API}/me/messages/${replyToMessageId}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: body }),
    });
    if (!res.ok) throw new Error(`Reply failed: ${res.status}`);
    return;
  }

  // New email
  const res = await fetch(`${GRAPH_API}/me/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "Text", content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
    }),
  });
  if (!res.ok) throw new Error(`Send failed: ${res.status}`);
}
