export function getTrelloAuthorizeUrl(returnUrl: string): string {
  const apiKey = process.env.TRELLO_API_KEY || "";
  return `https://trello.com/1/authorize?response_type=token&key=${apiKey}&return_url=${encodeURIComponent(returnUrl)}&scope=read&expiration=never&name=Work%20OS`;
}
