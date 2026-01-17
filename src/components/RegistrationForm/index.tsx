import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs, { Dayjs } from "dayjs";
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  IconButton,
  Divider,
  Radio,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import { postcodeValidator } from "postcode-validator";
import { COUNTRIES } from "../../appConstants/countries";
import { createCustomer } from "../../api/createCustomer";
import toast, { Toaster } from "react-hot-toast";
import { loginCustomer } from "../../api/loginCustomer";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useCookieManager } from "../../hooks/useCookieManager";

COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));
const COUNTRY_NAMES = COUNTRIES.map((country) => country.name);

interface Address {
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

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  addresses: Address[];
  defaultBillingIndex: number;
  defaultShippingIndex: number;
}

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

const schema = yup.object().shape({
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

const defaultAddress: Address = {
  billing: { country: "", street: "", city: "", postalCode: "" },
  shipping: { sameAsBilling: true, country: "", street: "", city: "", postalCode: "" },
};

const RegistrationForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as never,
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      dateOfBirth: null,
      addresses: [defaultAddress],
      defaultBillingIndex: 0,
      defaultShippingIndex: 0,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const navigate = useNavigate();
  const { setCookie } = useCookieManager();
  const { setIsLoggedIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  });

  const addresses = watch("addresses");
  const defaultBillingIndex = watch("defaultBillingIndex");
  const defaultShippingIndex = watch("defaultShippingIndex");

  const handleSameAsBilling = (idx: number, checked: boolean) => {
    setValue(`addresses.${idx}.shipping.sameAsBilling`, checked);
    if (checked) {
      setValue(`addresses.${idx}.shipping.country`, addresses[idx].billing.country);
      setValue(`addresses.${idx}.shipping.street`, addresses[idx].billing.street);
      setValue(`addresses.${idx}.shipping.city`, addresses[idx].billing.city);
      setValue(`addresses.${idx}.shipping.postalCode`, addresses[idx].billing.postalCode);
    }
  };

  const onSubmit = async (data: FormData) => {
    const loadingToast = toast.loading("Waiting...", {
      style: { fontSize: "20px" },
    });

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

    const defaultBillingAddress = defaultBillingIndex * 2;
    const defaultShippingAddress = defaultShippingIndex * 2 + 1;

    const result = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth.format("YYYY-MM-DD"),
      addresses: addressesArr,
      defaultBillingAddress,
      defaultShippingAddress,
    };

    const response = await createCustomer(result);

    if (!response.ok) {
      const err = await response.json();
      toast.dismiss(loadingToast);
      toast.error(err.message, {
        duration: 5000,
        style: { fontSize: "20px" },
      });
      return;
    }

    const customer = await response.json();
    console.log("customer created", customer);
    toast.success("Successfully created!", {
      duration: 5000,
      style: { fontSize: "20px" },
      id: loadingToast,
    });

    const loginResult = await loginCustomer({ email: data.email, password: data.password });
    if (loginResult.ok) {
      navigate("/");
      toast.success(`Hello, ${data.email}`, {
        duration: 5000,
        style: { fontSize: "20px" },
      });
    }
    const loginData = await loginResult.json();
    setIsLoggedIn(true);
    console.log("customer login", loginData);
    const expiresDate = new Date(Date.now() + loginData.expires_in * 1000);

    setCookie("access_token", loginData.access_token, { expires: expiresDate });
    setCookie("refresh_token", loginData.refresh_token);
    setCookie("scope", loginData.scope);
    setCookie("token_type", loginData.token_type);
  };

  const handleRemoveAdress = (idx: number) => {
    if (idx === defaultBillingIndex) setValue("defaultBillingIndex", 0);
    if (idx === defaultShippingIndex) setValue("defaultShippingIndex", 0);
    remove(idx);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ maxWidth: 700, mx: "auto", p: 3, boxShadow: 1, borderRadius: 1, background: "#fff" }}
    >
      <Toaster />
      <Grid container spacing={2}>
        <Grid size={6}>
          <TextField
            {...register("firstName")}
            label="First Name"
            fullWidth
            margin="normal"
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register("lastName")}
            label="Last Name"
            fullWidth
            margin="normal"
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register("email")}
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        </Grid>
        <Grid size={6}>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  {...field}
                  value={field.value}
                  label="Date of Birth"
                  format="MM/DD/YYYY"
                  onChange={(newValue) => {
                    field.onChange(newValue);
                    trigger("dateOfBirth");
                  }}
                  maxDate={dayjs("2025-05-12")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      error: !!error,
                      helperText: error?.message,
                    },
                  }}
                  onClose={() => {
                    trigger("dateOfBirth");
                  }}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>
      </Grid>

      <TextField
        {...register("password")}
        label="Password"
        type={showPassword ? "text" : "password"}
        variant="outlined"
        fullWidth
        margin="normal"
        error={!!errors.password}
        helperText={errors.password?.message}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" gutterBottom color="info">
        Address Information
      </Typography>

      {fields.map((field, idx) => (
        <Box key={field.id} sx={{ mb: 4, border: "1px solid #e0e0e0", borderRadius: 2, p: 2, position: "relative" }}>
          {fields.length > 1 && (
            <IconButton
              aria-label="delete"
              size="small"
              onClick={() => handleRemoveAdress(idx)}
              sx={{ position: "absolute", top: 8, right: 8 }}
            >
              <Delete />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ mb: 1, color: "#282828" }}>
            Billing Address #{idx + 1}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormControl fullWidth margin="normal" error={!!errors.addresses?.[idx]?.billing?.country}>
                <InputLabel id={`billing-country-label-${idx}`}>Country</InputLabel>
                <Select
                  {...register(`addresses.${idx}.billing.country`)}
                  labelId={`billing-country-label-${idx}`}
                  label="Country"
                  defaultValue=""
                >
                  {COUNTRY_NAMES.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.addresses?.[idx]?.billing?.country?.message}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TextField
                {...register(`addresses.${idx}.billing.postalCode`)}
                label="Postal Code"
                fullWidth
                margin="normal"
                error={!!errors.addresses?.[idx]?.billing?.postalCode}
                helperText={errors.addresses?.[idx]?.billing?.postalCode?.message}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                {...register(`addresses.${idx}.billing.street`)}
                label="Street Address"
                fullWidth
                margin="normal"
                error={!!errors.addresses?.[idx]?.billing?.street}
                helperText={errors.addresses?.[idx]?.billing?.street?.message}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                {...register(`addresses.${idx}.billing.city`)}
                label="City"
                fullWidth
                margin="normal"
                error={!!errors.addresses?.[idx]?.billing?.city}
                helperText={errors.addresses?.[idx]?.billing?.city?.message}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
            <Radio
              checked={defaultBillingIndex === idx}
              onChange={() => setValue("defaultBillingIndex", idx)}
              value={idx}
              color="primary"
              inputProps={{ "aria-label": `Set as default billing address #${idx + 1}` }}
            />
            <Typography color="info">Set as default billing address</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1, color: "#282828" }}>
            Shipping Address #{idx + 1}
          </Typography>
          <FormControlLabel
            sx={{ ml: 0 }}
            control={
              <Checkbox
                checked={!!addresses[idx]?.shipping?.sameAsBilling}
                onChange={(e) => handleSameAsBilling(idx, e.target.checked)}
              />
            }
            label={<Typography color="info">Use same as billing address</Typography>}
          />
          {!addresses[idx]?.shipping?.sameAsBilling && (
            <Grid container spacing={2}>
              <Grid size={6}>
                <FormControl fullWidth margin="normal" error={!!errors.addresses?.[idx]?.shipping?.country}>
                  <InputLabel id={`shipping-country-label-${idx}`}>Country</InputLabel>
                  <Select
                    {...register(`addresses.${idx}.shipping.country`)}
                    labelId={`shipping-country-label-${idx}`}
                    label="Country"
                    defaultValue=""
                  >
                    {COUNTRY_NAMES.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.addresses?.[idx]?.shipping?.country?.message}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <TextField
                  {...register(`addresses.${idx}.shipping.postalCode`)}
                  label="Postal Code"
                  fullWidth
                  margin="normal"
                  error={!!errors.addresses?.[idx]?.shipping?.postalCode}
                  helperText={errors.addresses?.[idx]?.shipping?.postalCode?.message}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  {...register(`addresses.${idx}.shipping.street`)}
                  label="Street Address"
                  fullWidth
                  margin="normal"
                  error={!!errors.addresses?.[idx]?.shipping?.street}
                  helperText={errors.addresses?.[idx]?.shipping?.street?.message}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  {...register(`addresses.${idx}.shipping.city`)}
                  label="City"
                  fullWidth
                  margin="normal"
                  error={!!errors.addresses?.[idx]?.shipping?.city}
                  helperText={errors.addresses?.[idx]?.shipping?.city?.message}
                />
              </Grid>
            </Grid>
          )}
          <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
            <Radio
              checked={defaultShippingIndex === idx}
              onChange={() => setValue("defaultShippingIndex", idx)}
              value={idx}
              color="primary"
              inputProps={{ "aria-label": `Set as default shipping address #${idx + 1}` }}
            />
            <Typography color="info">Set as default shipping address</Typography>
          </Box>
        </Box>
      ))}

      <Button variant="outlined" onClick={() => append(defaultAddress)} sx={{ mb: 2 }}>
        Add another address
      </Button>

      <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ mt: 3 }}>
        Register
      </Button>
    </Box>
  );
};

export default RegistrationForm;
