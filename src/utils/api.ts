import { Cart, createApiBuilderFromCtpClient, CartUpdateAction } from "@commercetools/platform-sdk";
import { ctpClient, createExistingTokenClient } from "./BuildClient";
import {
  ClientBuilder,
  createAuthForPasswordFlow,
  createAuthForAnonymousSessionFlow,
  TokenCache,
  TokenStore,
} from "@commercetools/sdk-client-v2";

export const projectKey = import.meta.env.VITE_CTP_PROJECT_KEY;
const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });

export const getCategoryByLocalizedName = async (name: string, locale: string) => {
  try {
    const response = await apiRoot
      .categories()
      .get({ queryArgs: { where: `name(${locale}="${name}")` } })
      .execute();
    return response.body.results[0];
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};

export const getProductsByCategory = async (
  categoryId: string,
  filters: string[] = [],
  sort?: string,
  offset: number = 0,
  limit: number = 12
) => {
  try {
    const response = await apiRoot
      .productProjections()
      .search()
      .get({
        queryArgs: {
          "filter.query": [`categories.id:"${categoryId}"`, ...filters],
          ...(sort ? { sort } : {}),
          offset,
          limit,
          expand: ["categories[*]"],
        },
      })
      .execute();
    return response.body;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};
export const getSubcategories = async (parentId: string) => {
  try {
    const response = await apiRoot
      .categories()
      .get({
        queryArgs: {
          where: `parent(id="${parentId}")`,
        },
      })
      .execute();
    return response.body.results;
  } catch (error) {
    console.error("API error (subcategories):", error);
    throw error;
  }
};

export const getProductByKey = async (key: string) => {
  try {
    const response = await apiRoot.products().withKey({ key }).get().execute();

    return response.body;
  } catch (error) {
    console.error("Error fetching product by key:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    let store: TokenStore | undefined = undefined;
    const tokenCache: TokenCache = {
      set(cache: TokenStore) {
        store = cache;
      },
      get() {
        return store ?? { token: "", refreshToken: "", expirationTime: 0 };
      },
    };

    const passwordClient = new ClientBuilder()
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
          scopes: [import.meta.env.VITE_CTP_SCOPES],
          tokenCache,
          fetch,
        })
      )
      .withHttpMiddleware({ host: import.meta.env.VITE_CTP_API_URL, fetch })
      .withUserAgentMiddleware()
      .build();

    const apiRootPassword = createApiBuilderFromCtpClient(passwordClient).withProjectKey({ projectKey });

    const response = await apiRootPassword.me().get().execute();

    const tokens = tokenCache.get();

    return {
      customer: response.body,
      accessToken: tokens?.token,
      refreshToken: tokens?.refreshToken,
    };
  } catch {
    throw new Error("General: An error occurred. Please try again later.");
  }
};

let anonymousTokenStore: TokenStore | undefined = undefined;
const anonymousTokenCache: TokenCache = {
  set(cache: TokenStore) {
    anonymousTokenStore = cache;
  },
  get() {
    return anonymousTokenStore ?? { token: "", refreshToken: "", expirationTime: 0 };
  },
};

const anonymousClient = new ClientBuilder()
  .withMiddleware(
    createAuthForAnonymousSessionFlow({
      host: import.meta.env.VITE_CTP_AUTH_URL,
      projectKey,
      credentials: {
        clientId: import.meta.env.VITE_CTP_CLIENT_ID,
        clientSecret: import.meta.env.VITE_CTP_CLIENT_SECRET,
      },
      scopes: import.meta.env.VITE_CTP_SCOPES.split(" "),
      tokenCache: anonymousTokenCache,
      fetch,
    })
  )
  .withHttpMiddleware({ host: import.meta.env.VITE_CTP_API_URL, fetch })
  .withUserAgentMiddleware()
  .build();

const apiRootAnonymous = createApiBuilderFromCtpClient(anonymousClient).withProjectKey({ projectKey });

export const getOrCreateCustomerCart = async (accessToken: string, anonymousCartId?: string): Promise<Cart> => {
  try {
    const customerClient = createExistingTokenClient(accessToken);
    const apiRootCustomer = createApiBuilderFromCtpClient(customerClient).withProjectKey({ projectKey });

    const cartResponse = await apiRootCustomer
      .me()
      .carts()
      .get({
        queryArgs: {
          where: ['cartState="Active"'],
          expand: ["lineItems[*].product"],
        },
      })
      .execute();

    let cart: Cart | undefined = cartResponse.body.results[0];

    if (!cart) {
      const createCartResponse = await apiRootCustomer
        .me()
        .carts()
        .post({
          body: {
            currency: "GBP",
            country: "GB",
            inventoryMode: "None",
            shippingMode: "Single",
            ...(anonymousCartId ? { anonymousCart: { id: anonymousCartId, type: "Cart" } } : {}),
          },
        })
        .execute();
      cart = createCartResponse.body;
    }

    return cart;
  } catch (error) {
    console.error("getOrCreateCustomerCart: Error fetching or creating cart:", error);
    throw new Error("Failed to fetch or create customer cart");
  }
};

export const mergeAnonymousCartToCustomerCart = async (
  anonymousCartId: string,
  customerCartId: string,
  accessToken: string
): Promise<Cart> => {
  try {
    const customerClient = createExistingTokenClient(accessToken);
    const apiRootCustomer = createApiBuilderFromCtpClient(customerClient).withProjectKey({ projectKey });

    const anonymousCart = await apiRootAnonymous
      .carts()
      .withId({ ID: anonymousCartId })
      .get({
        queryArgs: { expand: ["lineItems[*].product"] },
      })
      .execute()
      .then((res) => res.body);

    if (!anonymousCart.lineItems.length) {
      return await apiRootCustomer
        .carts()
        .withId({ ID: customerCartId })
        .get()
        .execute()
        .then((res) => res.body);
    }

    const customerCart = await apiRootCustomer
      .carts()
      .withId({ ID: customerCartId })
      .get()
      .execute()
      .then((res) => res.body);

    const addLineItemActions: CartUpdateAction[] = anonymousCart.lineItems.map((item) => ({
      action: "addLineItem",
      productId: item.productId,
      variantId: item.variant.id,
      quantity: item.quantity,
    }));

    const updatedCustomerCart = await apiRootCustomer
      .carts()
      .withId({ ID: customerCartId })
      .post({
        queryArgs: { expand: ["lineItems[*].product"] },
        body: {
          version: customerCart.version,
          actions: addLineItemActions,
        },
      })
      .execute()
      .then((res) => res.body);

    const anonymousCartVersion = anonymousCart.version;
    const removeLineItemActions: CartUpdateAction[] = anonymousCart.lineItems.map((item) => ({
      action: "removeLineItem",
      lineItemId: item.id,
    }));

    await apiRootAnonymous
      .carts()
      .withId({ ID: anonymousCartId })
      .post({
        body: {
          version: anonymousCartVersion,
          actions: removeLineItemActions,
        },
      })
      .execute();

    return updatedCustomerCart;
  } catch (error) {
    console.error("mergeAnonymousCartToCustomerCart: Error merging carts:", error);
    throw new Error("Failed to merge anonymous cart to customer cart");
  }
};

export const createAnonymousCart = async (): Promise<Cart> => {
  try {
    anonymousTokenStore = undefined;
    const response = await apiRootAnonymous
      .carts()
      .post({
        body: {
          currency: "GBP",
          country: "GB",
          inventoryMode: "None",
          shippingMode: "Single",
          anonymousId: `anon-${Math.random().toString(36).substring(2)}`,
        },
      })
      .execute();
    return response.body;
  } catch (error) {
    console.error("createAnonymousCart: Error creating anonymous cart:", error);
    throw new Error("Failed to create anonymous cart");
  }
};

export const getAnonymousCart = async (cartId: string): Promise<Cart | null> => {
  try {
    const response = await apiRootAnonymous
      .carts()
      .withId({ ID: cartId })
      .get({
        queryArgs: {
          expand: ["lineItems[*].product"],
        },
      })
      .execute();
    return response.body;
  } catch (error) {
    console.error("getAnonymousCart: Error fetching anonymous cart:", error);
    return null;
  }
};

export const addProductToCart = async (
  cartId: string,
  productId: string,
  variantId: number,
  quantity: number = 1,
  accessToken?: string
): Promise<Cart> => {
  try {
    const apiRoot = accessToken
      ? createApiBuilderFromCtpClient(createExistingTokenClient(accessToken)).withProjectKey({ projectKey })
      : apiRootAnonymous;

    const cartResponse = await apiRoot.carts().withId({ ID: cartId }).get().execute();
    const cartVersion = cartResponse.body.version;

    const response = await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        queryArgs: {
          expand: ["lineItems[*].product"],
        },
        body: {
          version: cartVersion,
          actions: [
            {
              action: "addLineItem",
              productId,
              variantId,
              quantity,
            },
          ],
        },
      })
      .execute();

    return response.body;
  } catch (error) {
    console.error("addProductToCart: Error adding product to cart:", error);
    throw new Error("Failed to add product to cart");
  }
};

export const changeLineItemQuantity = async (
  cartId: string,
  lineItemId: string,
  quantity: number,
  accessToken?: string
): Promise<Cart> => {
  try {
    const apiRoot = accessToken
      ? createApiBuilderFromCtpClient(createExistingTokenClient(accessToken)).withProjectKey({ projectKey })
      : apiRootAnonymous;

    const cartResponse = await apiRoot.carts().withId({ ID: cartId }).get().execute();
    const cartVersion = cartResponse.body.version;

    const response = await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        queryArgs: {
          expand: ["lineItems[*].product"],
        },
        body: {
          version: cartVersion,
          actions: [
            {
              action: "changeLineItemQuantity",
              lineItemId,
              quantity,
            },
          ],
        },
      })
      .execute();

    return response.body;
  } catch (error) {
    console.error("changeLineItemQuantity: Error updating line item quantity:", error);
    throw new Error("Failed to update line item quantity");
  }
};
export async function applyDiscountCode(cartId: string, cartVersion: number, code: string): Promise<Cart> {
  try {
    const response = await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        queryArgs: {
          expand: ["lineItems[*].product.custom"],
        },
        body: {
          version: cartVersion,
          actions: [{ action: "addDiscountCode", code: code.trim() }],
        },
      })
      .execute();
    return response.body;
  } catch (error) {
    throw new Error(error.message || "Invalid promo code");
  }
}
