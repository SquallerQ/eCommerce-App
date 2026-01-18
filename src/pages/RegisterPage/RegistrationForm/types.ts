import { Dayjs } from "dayjs";

export interface Address {
  billing: {
    country: string;
    street: string;
    city: string;
    postalCode: string;
  };
  shipping: {
    sameAsBilling: boolean;
    country: string;
    street: string;
    city: string;
    postalCode: string;
  };
}

export interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  addresses: Address[];
  defaultBillingIndex: number;
  defaultShippingIndex: number;
}

export const defaultAddress: Address = {
  billing: { country: "", street: "", city: "", postalCode: "" },
  shipping: { sameAsBilling: true, country: "", street: "", city: "", postalCode: "" },
};
