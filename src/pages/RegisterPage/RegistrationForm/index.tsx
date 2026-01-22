import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registrationSchema } from "./validation";
import dayjs from "dayjs";
import {
  TextField,
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
import { COUNTRY_NAMES } from "./countriesList";
import { FormData, defaultAddress } from "./types";
import { transformFormDataToAPI } from "./utils";
import { createCustomer } from "../../../api/createCustomer";
import toast, { Toaster } from "react-hot-toast";
import { loginCustomer } from "../../../api/loginCustomer";
import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import { useCookieManager } from "../../../hooks/useCookieManager";
import { inputStyles, typographyStyles } from "./formStyles";
import styles from "./styles.module.css";

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
    resolver: yupResolver(registrationSchema) as never,
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
    const loadingToast = toast.loading("Waiting...", { style: { fontSize: "20px" } });

    const result = transformFormDataToAPI(data);
    const response = await createCustomer(result);

    if (!response.ok) {
      const err = await response.json();
      toast.dismiss(loadingToast);
      toast.error(err.message, { duration: 5000, style: { fontSize: "20px" } });
      return;
    }

    const customer = await response.json();
    console.log("customer created", customer);
    toast.success("Successfully created!", { duration: 5000, style: { fontSize: "20px" }, id: loadingToast });

    const loginResult = await loginCustomer({ email: data.email, password: data.password });
    if (loginResult.ok) {
      navigate("/");
      toast.success(`Hello, ${data.email}`, { duration: 5000, style: { fontSize: "20px" } });
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
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate className={styles.formContainer}>
      <h1 className={styles.formTitle}>Create Account</h1>
      <Toaster />
      <Grid container columnSpacing={2}>
        <Grid size={6}>
          <TextField
            {...register("firstName")}
            label="First Name"
            fullWidth
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            sx={inputStyles}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register("lastName")}
            label="Last Name"
            fullWidth
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            sx={inputStyles}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            {...register("email")}
            label="Email"
            type="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={inputStyles}
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
                      error: !!error,
                      helperText: error?.message,
                      sx: {
                        ...inputStyles,
                        backgroundColor: "white",
                        "& fieldset": {
                          borderColor: "#ccc !important",
                        },
                        "&:hover fieldset": {
                          borderColor: "#4a06a9 !important",
                        },
                        "& .Mui-focused fieldset": {
                          borderColor: "#4a06a9 !important",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#4a06a9",
                        },
                      },
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
        error={!!errors.password}
        helperText={errors.password?.message}
        sx={inputStyles}
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

      <h3 className={styles.sectionHeading}>Address Information</h3>

      {fields.map((field, idx) => (
        <Box key={field.id} className={styles.addressBox}>
          {fields.length > 1 && (
            <IconButton
              aria-label="delete"
              size="small"
              onClick={() => handleRemoveAdress(idx)}
              className={styles.deleteButton}
            >
              <Delete />
            </IconButton>
          )}
          <Typography variant="subtitle1" className={styles.sectionTitle} sx={{ ...typographyStyles }}>
            Billing Address #{idx + 1}
          </Typography>
          <Grid container columnSpacing={2}>
            <Grid size={6}>
              <FormControl fullWidth error={!!errors.addresses?.[idx]?.billing?.country} sx={inputStyles}>
                <InputLabel id={`billing-country-label-${idx}`}>Country</InputLabel>
                <Select
                  {...register(`addresses.${idx}.billing.country`)}
                  labelId={`billing-country-label-${idx}`}
                  label="Country"
                  defaultValue=""
                  sx={{ backgroundColor: "white" }}
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
                error={!!errors.addresses?.[idx]?.billing?.postalCode}
                helperText={errors.addresses?.[idx]?.billing?.postalCode?.message}
                sx={inputStyles}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                {...register(`addresses.${idx}.billing.street`)}
                label="Street Address"
                fullWidth
                error={!!errors.addresses?.[idx]?.billing?.street}
                helperText={errors.addresses?.[idx]?.billing?.street?.message}
                sx={inputStyles}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                {...register(`addresses.${idx}.billing.city`)}
                label="City"
                fullWidth
                error={!!errors.addresses?.[idx]?.billing?.city}
                helperText={errors.addresses?.[idx]?.billing?.city?.message}
                sx={inputStyles}
              />
            </Grid>
          </Grid>
          <Box className={styles.defaultAddressRow}>
            <Radio
              checked={defaultBillingIndex === idx}
              onChange={() => setValue("defaultBillingIndex", idx)}
              value={idx}
              sx={{
                color: "#8b5cf6",
                "&.Mui-checked": { color: "#8b5cf6" },
              }}
              inputProps={{ "aria-label": `Set as default billing address #${idx + 1}` }}
            />
            <Typography sx={{ ...typographyStyles }}>Set as default billing address</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ ...typographyStyles }}>
            Shipping Address #{idx + 1}
          </Typography>
          <FormControlLabel
            sx={{ ml: 0 }}
            control={
              <Checkbox
                checked={!!addresses[idx]?.shipping?.sameAsBilling}
                onChange={(e) => handleSameAsBilling(idx, e.target.checked)}
                sx={{
                  color: "#8b5cf6",
                  "&.Mui-checked": { color: "#8b5cf6" },
                }}
              />
            }
            label={<Typography sx={{ ...typographyStyles }}>Use same as billing address</Typography>}
          />
          {!addresses[idx]?.shipping?.sameAsBilling && (
            <Grid container spacing={2}>
              <Grid size={6}>
                <FormControl fullWidth error={!!errors.addresses?.[idx]?.shipping?.country}>
                  <InputLabel id={`shipping-country-label-${idx}`}>Country</InputLabel>
                  <Select
                    {...register(`addresses.${idx}.shipping.country`)}
                    labelId={`shipping-country-label-${idx}`}
                    label="Country"
                    defaultValue=""
                    sx={inputStyles}
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
                  error={!!errors.addresses?.[idx]?.shipping?.postalCode}
                  helperText={errors.addresses?.[idx]?.shipping?.postalCode?.message}
                  sx={inputStyles}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  {...register(`addresses.${idx}.shipping.street`)}
                  label="Street Address"
                  fullWidth
                  error={!!errors.addresses?.[idx]?.shipping?.street}
                  helperText={errors.addresses?.[idx]?.shipping?.street?.message}
                  sx={inputStyles}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  {...register(`addresses.${idx}.shipping.city`)}
                  label="City"
                  fullWidth
                  error={!!errors.addresses?.[idx]?.shipping?.city}
                  helperText={errors.addresses?.[idx]?.shipping?.city?.message}
                  sx={inputStyles}
                />
              </Grid>
            </Grid>
          )}
          <Box className={styles.defaultAddressRow}>
            <Radio
              checked={defaultShippingIndex === idx}
              onChange={() => setValue("defaultShippingIndex", idx)}
              value={idx}
              sx={{
                color: "#8b5cf6",
                "&.Mui-checked": { color: "#8b5cf6" },
              }}
              inputProps={{ "aria-label": `Set as default shipping address #${idx + 1}` }}
            />
            <Typography sx={{ ...typographyStyles }}>Set as default shipping address</Typography>
          </Box>
        </Box>
      ))}

      <button className={styles.addAddressButton} onClick={() => append(defaultAddress)}>
        Add another address
      </button>

      <button className={styles.submitButton} type="submit">
        Register
      </button>
    </Box>
  );
};

export default RegistrationForm;
