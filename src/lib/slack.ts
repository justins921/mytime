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

export async function getUserInfo(token: string, userId: string) {
  return slackGet("users.info", token, { user: userId });
}

export function userDisplayName(user: {
  profile?: { display_name?: string };
  real_name?: string;
  name?: string;
  id: string;
}): string {
  return user.profile?.display_name || user.real_name || user.name || user.id;
}

export async function resolveUserIds(
  token: string,
  userIds: string[],
  existingMap: Record<string, string> = {}
): Promise<Record<string, string>> {
  const map = { ...existingMap };
  const missing = userIds.filter((id) => id && !map[id]);
  const unique = [...new Set(missing)];

  await Promise.all(
    unique.map(async (uid) => {
      try {
        const result = await getUserInfo(token, uid);
        if (result.ok && result.user) {
          map[uid] = userDisplayName(result.user);
        }
      } catch {
        // leave unresolved
      }
    })
  );
  return map;
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
