export async function getAccessToken() {
  const clientId = import.meta.env.VITE_CTP_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_CTP_CLIENT_SECRET;
  const authUrl = import.meta.env.VITE_CTP_AUTH_URL;
  const scope = import.meta.env.VITE_CTP_SCOPES;

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${authUrl}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials&${scope}`,
  });

  if (!response.ok) {
    throw new Error("Failed to get token: " + (await response.text()));
  }

  const data = await response.json();
  return data.access_token;
}
