const projectKey = import.meta.env.VITE_CTP_PROJECT_KEY;
const clientId = import.meta.env.VITE_CTP_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CTP_CLIENT_SECRET;
const authUrl = import.meta.env.VITE_CTP_AUTH_URL;

export async function loginCustomer({ email, password }: { email: string; password: string }) {
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${authUrl}/oauth/${projectKey}/customers/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=password&username=${email}&password=${password}`,
  });

  return response;
}
