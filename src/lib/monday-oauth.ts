export async function exchangeMondayCode(code: string, redirectUri: string) {
  const res = await fetch("https://auth.monday.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MONDAY_CLIENT_ID || "",
      client_secret: process.env.MONDAY_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      code,
    }),
  });
  return res.json();
}
