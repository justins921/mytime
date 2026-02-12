const SLACK_API = "https://slack.com/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function slackGet(method: string, token: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`${SLACK_API}/${method}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function slackPost(method: string, token: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function listConversations(token: string) {
  return slackGet("conversations.list", token, {
    types: "public_channel,private_channel,im,mpim",
    limit: "200",
    exclude_archived: "true",
  });
}

export async function getConversationHistory(token: string, channel: string, limit = "50") {
  return slackGet("conversations.history", token, { channel, limit });
}

export async function postMessage(token: string, channel: string, text: string) {
  return slackPost("chat.postMessage", token, { channel, text });
}

export async function getUsersList(token: string) {
  return slackGet("users.list", token, { limit: "200" });
}

export async function exchangeOAuthCode(code: string, redirectUri: string) {
  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID || "",
      client_secret: process.env.SLACK_CLIENT_SECRET || "",
      code,
      redirect_uri: redirectUri,
    }),
  });
  return res.json();
}

export const SLACK_USER_SCOPES = [
  "channels:read",
  "channels:history",
  "groups:read",
  "groups:history",
  "im:read",
  "im:history",
  "mpim:read",
  "mpim:history",
  "chat:write",
  "users:read",
  "team:read",
].join(",");
