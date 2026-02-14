export async function exchangeClickUpCode(code: string) {
  const res = await fetch("https://api.clickup.com/api/v2/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.CLICKUP_CLIENT_ID || "",
      client_secret: process.env.CLICKUP_CLIENT_SECRET || "",
      code,
    }),
  });
  return res.json();
}
