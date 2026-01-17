import { getAccessToken } from "./getAccessToken";

const projectKey = import.meta.env.VITE_CTP_PROJECT_KEY;
const apiUrl = import.meta.env.VITE_CTP_API_URL;

export async function createCustomer(customerDraft) {
  const token = await getAccessToken();

  const response = await fetch(`${apiUrl}/${projectKey}/customers`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerDraft),
  });

  return response;
}
