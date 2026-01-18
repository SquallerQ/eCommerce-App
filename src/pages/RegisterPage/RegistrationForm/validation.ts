import * as yup from "yup";
import dayjs, { Dayjs } from "dayjs";
import { postcodeValidator } from "postcode-validator";
import { COUNTRIES } from "./countriesList";

const addressSchema = yup.object().shape({
  billing: yup.object().shape({
    country: yup.string().required("Country is required"),
    street: yup
      .string()
      .required("Street address is required")
      .matches(/^[a-zA-Z0-9\s-]+$/, "Only Latin letters are allowed"),
    city: yup
      .string()
      .required("City is required")
      .matches(/^[a-zA-Z\s]+$/, "Only Latin letters are allowed"),
    postalCode: yup
      .string()
      .required("Postal code is required")
      .test("postal-code-format", "Invalid postal code format", function (value) {
        const countryName = this.parent.country;
        if (!countryName || !value) return false;
        const country = COUNTRIES.find((c) => c.name === countryName);
        if (!country) return false;
        try {
          return postcodeValidator(value, country.code);
        } catch {
          return false;
        }
      }),
  }),
  shipping: yup.object().shape({
    sameAsBilling: yup.boolean(),
    country: yup.string().when("sameAsBilling", {
      is: false,
      then: (schema) => schema.required("Country is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    street: yup.string().when("sameAsBilling", {
      is: false,
      then: (schema) =>
        schema.required("Street address is required").matches(/^[a-zA-Z0-9\s-]+$/, "Only Latin letters are allowed"),
      otherwise: (schema) => schema.notRequired(),
    }),
    city: yup.string().when("sameAsBilling", {
      is: false,
      then: (schema) => schema.required("City is required").matches(/^[a-zA-Z\s]+$/, "Only Latin letters are allowed"),
      otherwise: (schema) => schema.notRequired(),
    }),
    postalCode: yup.string().when("sameAsBilling", {
      is: false,
      then: (schema) =>
        schema
          .required("Postal code is required")
          .test("postal-code-format", "Invalid postal code format", function (value) {
            const countryName = this.parent.country;
            if (!countryName || !value) return false;
            const country = COUNTRIES.find((c) => c.name === countryName);
            if (!country) return false;
            try {
              return postcodeValidator(value, country.code);
            } catch {
              return false;
            }
          }),
      otherwise: (schema) => schema.notRequired(),
    }),
  }),
});

export const registrationSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required")
    .matches(/^[a-zA-Z0-9@._-]+$/, "Only Latin letters are allowed"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  firstName: yup
    .string()
    .required("First name is required")
    .matches(/^[a-zA-Z]+$/, "Only Latin letters are allowed"),
  lastName: yup
    .string()
    .required("Last name is required")
    .matches(/^[a-zA-Z]+$/, "Only Latin letters are allowed"),
  dateOfBirth: yup
    .mixed<Dayjs>()
    .required("Date of birth is required")
    .test("is-valid-date", "Please enter a valid date", (value) => {
      if (!value) return false;
      const date = dayjs(value);
      return date.isValid();
    })
    .test("not-future-date", "Date cannot be in the future", (value) => {
      if (!value) return false;
      const date = dayjs(value);
      return date.isBefore(dayjs(), "day") || date.isSame(dayjs(), "day");
    })
    .test("is-old-enough", "You must be at least 13 years old", (value) => {
      if (!value) return false;
      const now = dayjs();
      return now.diff(dayjs(value), "year") >= 13;
    }),
  addresses: yup.array().of(addressSchema).min(1, "At least one address is required"),
  defaultBillingIndex: yup.number().min(0, "Choose default billing address"),
  defaultShippingIndex: yup.number().min(0, "Choose default shipping address"),
});
