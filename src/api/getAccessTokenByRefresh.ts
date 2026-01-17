export async function getAccessTokenByRefresh(refreshToken: string) {
  const clientId = import.meta.env.VITE_CTP_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_CTP_CLIENT_SECRET;
  const authUrl = import.meta.env.VITE_CTP_AUTH_URL;
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${authUrl}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  return response;
}
