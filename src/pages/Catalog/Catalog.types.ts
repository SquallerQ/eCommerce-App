import { ProductProjection } from "@commercetools/platform-sdk";

export interface ProductAttribute {
  name: string;
  value: string | number | boolean;
}

export interface ProductPrice {
  value: { centAmount: number; currencyCode: string };
  discounted?: { value: { centAmount: number } };
}

export interface ProductVariant {
  attributes?: ProductAttribute[];
  images?: Array<{ url: string }>;
  prices?: ProductPrice[];
  id: number;
  sku?: string;
}

export interface Product {
  id: string;
  key?: string;
  name?: { "en-GB"?: string };
  masterVariant?: ProductVariant;
  masterData: {
    current: {
      name: { "en-GB": string };
      masterVariant: {
        id: number;
        sku?: string;
        prices?: Array<{ value: { centAmount: number; currencyCode: string } }>;
      };
      variants: Array<{
        id: number;
        sku?: string;
        prices?: Array<{ value: { centAmount: number; currencyCode: string } }>;
      }>;
    };
  };
}

export interface ProductListProps {
  products: ProductProjection[];
  loading: boolean;
  onAddToCart: (productId: string, variantId: number, action: "add" | "increment" | "decrement") => void;
  isAdding: boolean;
  getProductQuantity: (productId: string, variantId: number) => { quantity: number; lineItemId?: string };
}
