import { prisma } from "@/lib/db";

export async function exchangeAsanaCode(code: string, redirectUri: string) {
  const res = await fetch("https://app.asana.com/-/oauth_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ASANA_CLIENT_ID || "",
      client_secret: process.env.ASANA_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      code,
    }),
  });
  return res.json();
}

export async function refreshAsanaToken(refreshToken: string) {
  const res = await fetch("https://app.asana.com/-/oauth_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ASANA_CLIENT_ID || "",
      client_secret: process.env.ASANA_CLIENT_SECRET || "",
      refresh_token: refreshToken,
    }),
  });
  return res.json();
}

export async function getValidAsanaToken(userId: string): Promise<string> {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings || !settings.asanaApiToken) throw new Error("Asana not connected");

  // If no refresh token, it's a manually entered PAT — return as-is
  if (!settings.asanaRefreshToken) return settings.asanaApiToken;

  const now = Math.floor(Date.now() / 1000);
  if (settings.asanaTokenExpiresAt > now + 300) {
    return settings.asanaApiToken;
  }

  const data = await refreshAsanaToken(settings.asanaRefreshToken);
  if (!data.access_token) throw new Error("Failed to refresh Asana token");

  await prisma.settings.update({
    where: { userId },
    data: {
      asanaApiToken: data.access_token,
      asanaRefreshToken: data.refresh_token || settings.asanaRefreshToken,
      asanaTokenExpiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    },
  });

  return data.access_token;
}
