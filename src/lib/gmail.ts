import { prisma } from "@/lib/db";

const GOOGLE_API = "https://www.googleapis.com";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

// ─── OAuth helpers ─────────────────────────────────────────

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return res.json();
}

/** Get a valid access token, refreshing if expired */
export async function getValidToken(accountId: string): Promise<string> {
  const account = await prisma.gmailAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Gmail account not found");

  const now = Math.floor(Date.now() / 1000);
  // Refresh if expires within 5 minutes
  if (account.expiresAt && account.expiresAt > now + 300) {
    return account.accessToken;
  }

  const data = await refreshAccessToken(account.refreshToken);
  if (!data.access_token) throw new Error("Failed to refresh token");

  await prisma.gmailAccount.update({
    where: { id: accountId },
    data: {
      accessToken: data.access_token,
      expiresAt: now + data.expires_in,
    },
  });

  return data.access_token;
}

// ─── Gmail API helpers ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gmailGet(path: string, token: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`${GOOGLE_API}/gmail/v1/users/me/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gmailPost(path: string, token: string, body: unknown): Promise<any> {
  const res = await fetch(`${GOOGLE_API}/gmail/v1/users/me/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getUserEmail(token: string): Promise<string> {
  const res = await fetch(`${GOOGLE_API}/oauth2/v2/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.email || "";
}

export interface GmailListResult {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export async function listMessages(
  token: string,
  query?: string,
  maxResults = 30,
  pageToken?: string
): Promise<GmailListResult> {
  const params: Record<string, string> = { maxResults: String(maxResults) };
  if (query) params.q = query;
  if (pageToken) params.pageToken = pageToken;
  return gmailGet("messages", token, params);
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: {
    headers: { name: string; value: string }[];
    mimeType: string;
    body?: { data?: string; size: number };
    parts?: GmailPart[];
  };
}

export interface GmailPart {
  mimeType: string;
  body?: { data?: string; size: number };
  parts?: GmailPart[];
}

export async function getMessage(token: string, messageId: string): Promise<GmailMessage> {
  return gmailGet(`messages/${messageId}`, token, { format: "full" });
}

export async function getMessageMetadata(token: string, messageId: string): Promise<GmailMessage> {
  return gmailGet(`messages/${messageId}`, token, { format: "metadata", metadataHeaders: "From,To,Subject,Date" });
}

export async function modifyLabels(
  token: string,
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
) {
  return gmailPost(`messages/${messageId}/modify`, token, {
    addLabelIds,
    removeLabelIds,
  });
}

export async function sendEmail(
  token: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string,
  inReplyTo?: string,
  references?: string
) {
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset="UTF-8"`,
  ];
  if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
  if (references) headers.push(`References: ${references}`);

  const rawMessage = [...headers, "", body].join("\r\n");
  const encoded = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { raw: encoded };
  if (threadId) payload.threadId = threadId;

  return gmailPost("messages/send", token, payload);
}

// ─── Parsing helpers ───────────────────────────────────────

export function getHeader(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value || "";
}

export function getPlainBody(msg: GmailMessage): string {
  // Try direct body
  if (msg.payload?.body?.data) {
    return decodeBase64Url(msg.payload.body.data);
  }
  // Search parts
  if (msg.payload?.parts) {
    const text = findPart(msg.payload.parts, "text/plain");
    if (text) return text;
    const html = findPart(msg.payload.parts, "text/html");
    if (html) return html;
  }
  return msg.snippet || "";
}

function findPart(parts: GmailPart[], mimeType: string): string | null {
  for (const part of parts) {
    if (part.mimeType === mimeType && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      const result = findPart(part.parts, mimeType);
      if (result) return result;
    }
  }
  return null;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}
