import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import {
  Client,
  ClientBuilder,
  createAuthForClientCredentialsFlow,
  createAuthForPasswordFlow,
  createHttpClient,
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
} from "@commercetools/sdk-client-v2";

const projectKey = import.meta.env.VITE_CTP_PROJECT_KEY;
const scopes = [import.meta.env.VITE_CTP_SCOPES];

const authMiddlewareOptions: AuthMiddlewareOptions = {
  host: import.meta.env.VITE_CTP_AUTH_URL,
  projectKey,
  credentials: {
    clientId: import.meta.env.VITE_CTP_CLIENT_ID,
    clientSecret: import.meta.env.VITE_CTP_CLIENT_SECRET,
  },
  oauthUri: import.meta.env.VITE_CTP_OAUTH_URI,
  scopes,
  fetch,
};

const httpMiddlewareOptions: HttpMiddlewareOptions = {
  host: import.meta.env.VITE_CTP_API_URL,
  fetch,
};

export const createPasswordFlowClient = (email: string, password: string): Client => {
  return new ClientBuilder()
    .withProjectKey(projectKey)
    .withMiddleware(
      createAuthForPasswordFlow({
        host: import.meta.env.VITE_CTP_AUTH_URL,
        projectKey,
        credentials: {
          clientId: import.meta.env.VITE_CTP_CLIENT_ID,
          clientSecret: import.meta.env.VITE_CTP_CLIENT_SECRET,
          user: { username: email, password },
        },
        scopes,
        fetch,
      })
    )
    .withMiddleware(createHttpClient(httpMiddlewareOptions))
    .withUserAgentMiddleware()
    .build();
};

export const createExistingTokenClient = (token: string): Client => {
  return new ClientBuilder()
    .withExistingTokenFlow(`Bearer ${token}`, { force: true })
    .withHttpMiddleware(httpMiddlewareOptions)
    .withProjectKey(projectKey)
    .withUserAgentMiddleware()
    .build();
};

export const createCustomerApiRoot = (accessToken: string) => {
  const client = createExistingTokenClient(accessToken);
  return createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });
};

export const ctpClient = new ClientBuilder()
  .withProjectKey(projectKey)
  .withMiddleware(createAuthForClientCredentialsFlow(authMiddlewareOptions))
  .withMiddleware(createHttpClient(httpMiddlewareOptions))
  .withUserAgentMiddleware()
  .build();
