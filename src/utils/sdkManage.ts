import { Customer, MyCustomerUpdateAction } from "@commercetools/platform-sdk";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import { createCustomerApiRoot, createExistingTokenClient } from "./BuildClient";

const projectKey = import.meta.env.VITE_CTP_PROJECT_KEY;

export const getCurrentCustomer = async (accessToken: string): Promise<Customer> => {
  const client = createExistingTokenClient(accessToken);
  const apiRoot = createApiBuilderFromCtpClient(client).withProjectKey({ projectKey });

  const response = await apiRoot.me().get().execute();
  return response.body;
};

export const getCustomerVersion = async (accessToken: string): Promise<number> => {
  if (!accessToken) {
    throw new Error("Access token is required to fetch customer version");
  }

  try {
    const customer = await getCurrentCustomer(accessToken);
    if (typeof customer.version !== "number") {
      throw new Error("Invalid customer version received");
    }
    return customer.version;
  } catch (error) {
    console.error("Error fetching customer version:", error);
    throw new Error("Failed to retrieve customer version. Please try again later.");
  }
};

export const updateCustomer = async (
  accessToken: string,
  payload: {
    version: number;
    actions: MyCustomerUpdateAction[];
  }
): Promise<Customer | string> => {
  try {
    const apiRoot = createCustomerApiRoot(accessToken);
    const response = await apiRoot
      .me()
      .post({
        body: payload,
      })
      .execute();

    return response.body;
  } catch (error) {
    console.error("Error updating customer:", error);
    return error instanceof Error ? error.message : "Failed to update customer";
  }
};

export const updatePassword = async (
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<{ email: string; error: string }> => {
  const output = {
    email: "",
    error: "",
  };

  try {
    const version = await getCustomerVersion(accessToken);
    const apiRoot = createCustomerApiRoot(accessToken);
    const response = await apiRoot.me().password().post({ body: { version, currentPassword, newPassword } }).execute();
    output.email = response.body.email;
  } catch (err) {
    console.error("Error updating password:", err);
  }

  return output;
};
