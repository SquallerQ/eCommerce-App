import { COUNTRIES } from "./countriesList";
import { FormData } from "./types";

export const transformFormDataToAPI = (data: FormData) => {
  const addressesArr: {
    key: string;
    country: string;
    streetName: string;
    city: string;
    postalCode: string;
  }[] = [];

  data.addresses.forEach((pair, idx) => {
    addressesArr.push({
      key: `billing-${idx + 1}`,
      country: COUNTRIES.find((c) => c.name === pair.billing.country)?.code || "",
      streetName: pair.billing.street,
      city: pair.billing.city,
      postalCode: pair.billing.postalCode,
    });

    if (pair.shipping.sameAsBilling) {
      addressesArr.push({
        key: `shipping-${idx + 1}`,
        country: COUNTRIES.find((c) => c.name === pair.billing.country)?.code || "",
        streetName: pair.billing.street,
        city: pair.billing.city,
        postalCode: pair.billing.postalCode,
      });
    } else {
      addressesArr.push({
        key: `shipping-${idx + 1}`,
        country: COUNTRIES.find((c) => c.name === pair.shipping.country)?.code || "",
        streetName: pair.shipping.street,
        city: pair.shipping.city,
        postalCode: pair.shipping.postalCode,
      });
    }
  });

  const defaultBillingAddress = data.defaultBillingIndex * 2;
  const defaultShippingAddress = data.defaultShippingIndex * 2 + 1;

  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth?.format("YYYY-MM-DD") || "",
    addresses: addressesArr,
    defaultBillingAddress,
    defaultShippingAddress,
  };
};
