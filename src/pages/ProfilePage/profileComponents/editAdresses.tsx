import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./Profile.module.css";
import { Customer, MyCustomerUpdateAction } from "@commercetools/platform-sdk";
import { postcodeValidator } from "postcode-validator";
import { COUNTRIES } from "../../../components/RegistrationForm/countriesList";
import { useCookieManager } from "../../../hooks/useCookieManager";
import { getCurrentCustomer } from "../../../utils/sdkManage";

interface EditAddressFormProps {
  customer: Customer;
  onSave: (actions: MyCustomerUpdateAction[]) => Promise<void>;
  onCancel: () => void;
  isUpdating?: boolean;
}

interface Address {
  id?: string;
  streetName: string;
  city: string;
  country: string;
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

interface AddressErrors {
  [index: number]: {
    streetName?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
}

export const EditAddressForm = ({ customer, onSave, onCancel, isUpdating = false }: EditAddressFormProps) => {
  const [addresses, setAddresses] = useState<Address[]>(
    customer.addresses?.map((addr) => ({
      id: addr.id,
      streetName: addr.streetName || "",
      city: addr.city || "",
      country: COUNTRIES.find((c) => c.name === addr.country)?.code || addr.country || "",
      postalCode: addr.postalCode || "",
      isDefaultShipping: customer.defaultShippingAddressId === addr.id,
      isDefaultBilling: customer.defaultBillingAddressId === addr.id,
    })) || []
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const { cookies } = useCookieManager();

  const validateAddress = (address: Address): AddressErrors[number] | null => {
    const newErrors: AddressErrors[number] = {};

    if (!address.streetName) {
      newErrors.streetName = "Street address is required";
    } else if (!/^[a-zA-Z0-9\s-]+$/.test(address.streetName)) {
      newErrors.streetName = "Only Latin letters, numbers, spaces, and hyphens are allowed";
    }

    if (!address.city) {
      newErrors.city = "City is required";
    } else if (!/^[a-zA-Z\s]+$/.test(address.city)) {
      newErrors.city = "Only Latin letters and spaces are allowed";
    }

    if (!address.country) {
      newErrors.country = "Country is required";
    } else if (!COUNTRIES.some((c) => c.code === address.country)) {
      newErrors.country = "Please select a valid country";
    }

    if (!address.postalCode) {
      newErrors.postalCode = "Postal code is required";
    } else if (!postcodeValidator(address.postalCode, address.country)) {
      newErrors.postalCode = "Invalid postal code format";
    }

    return Object.keys(newErrors).length > 0 ? newErrors : null;
  };

  const handleAddressChange = (index: number, field: string, value: string | boolean) => {
    setAddresses((prev) => {
      const newAddresses = [...prev];
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      return newAddresses;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index]?.[field as keyof AddressErrors[number]];
      return newErrors;
    });
  };

  const handleAddAddress = () => {
    setAddresses((prev) => [
      ...prev,
      {
        streetName: "",
        city: "",
        country: "",
        postalCode: "",
        isDefaultShipping: false,
        isDefaultBilling: false,
      },
    ]);
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: AddressErrors = {};
    let isValid = true;
    addresses.forEach((address, index) => {
      const addressErrors = validateAddress(address);
      if (addressErrors) {
        newErrors[index] = addressErrors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    if (!isValid) {
      toast.error("Please fix the errors in the address fields.");
      return;
    }

    const actions: MyCustomerUpdateAction[] = [];

    customer.addresses?.forEach((originalAddress) => {
      if (!addresses.some((addr) => addr.id === originalAddress.id)) {
        if (customer.defaultShippingAddressId === originalAddress.id) {
          actions.push({ action: "setDefaultShippingAddress" });
        }
        if (customer.defaultBillingAddressId === originalAddress.id) {
          actions.push({ action: "setDefaultBillingAddress" });
        }
        actions.push({ action: "removeAddress", addressId: originalAddress.id });
      }
    });

    addresses.forEach((address) => {
      if (address.id) {
        actions.push({
          action: "changeAddress",
          addressId: address.id,
          address: {
            streetName: address.streetName,
            city: address.city,
            country: address.country,
            postalCode: address.postalCode,
          },
        });
      } else {
        actions.push({
          action: "addAddress",
          address: {
            streetName: address.streetName,
            city: address.city,
            country: address.country,
            postalCode: address.postalCode,
          },
        });
      }
    });

    try {
      await onSave(actions);
      const updatedCustomer = await getCurrentCustomer(cookies.access_token);
      const newActions: MyCustomerUpdateAction[] = [];
      addresses.forEach((address) => {
        const addressId =
          address.id ||
          updatedCustomer.addresses.find(
            (a) =>
              a.streetName === address.streetName &&
              a.city === address.city &&
              a.country === address.country &&
              a.postalCode === address.postalCode
          )?.id;

        if (addressId && address.isDefaultShipping && updatedCustomer.defaultShippingAddressId !== addressId) {
          newActions.push({ action: "setDefaultShippingAddress", addressId });
        } else if (addressId && !address.isDefaultShipping && updatedCustomer.defaultShippingAddressId === addressId) {
          newActions.push({ action: "setDefaultShippingAddress" });
        }

        if (addressId && address.isDefaultBilling && updatedCustomer.defaultBillingAddressId !== addressId) {
          newActions.push({ action: "setDefaultBillingAddress", addressId });
        } else if (addressId && !address.isDefaultBilling && updatedCustomer.defaultBillingAddressId === addressId) {
          newActions.push({ action: "setDefaultBillingAddress" });
        }
      });

      if (newActions.length > 0) {
        await onSave(newActions);
      }

      toast.success("Addresses updated successfully!");
    } catch (error) {
      console.error("Error updating addresses:", error);
      toast.error("Failed to update addresses. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <div className={styles.formSection}>
        <h2 className={styles.sectionHeader}>Edit Addresses</h2>

        {addresses.map((address, index) => (
          <div key={address.id || `new-${index}`} className={styles.addressForm}>
            <div className={styles.addressHeader}>
              <h3>Address {index + 1}</h3>
              {addresses.length > 1 && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveAddress(index)}
                  disabled={isUpdating}
                >
                  Remove
                </button>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Street</label>
              <input
                type="text"
                value={address.streetName}
                onChange={(e) => handleAddressChange(index, "streetName", e.target.value)}
                disabled={isUpdating}
                required
                className={styles.formInput}
              />
              {errors[index]?.streetName && <span className={styles.error}>{errors[index].streetName}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => handleAddressChange(index, "city", e.target.value)}
                  disabled={isUpdating}
                  required
                  className={styles.formInput}
                />
                {errors[index]?.city && <span className={styles.error}>{errors[index].city}</span>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Postal Code</label>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => handleAddressChange(index, "postalCode", e.target.value)}
                  disabled={isUpdating}
                  required
                  className={styles.formInput}
                />
                {errors[index]?.postalCode && <span className={styles.error}>{errors[index].postalCode}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Country</label>
              <select
                value={address.country}
                onChange={(e) => handleAddressChange(index, "country", e.target.value)}
                disabled={isUpdating}
                required
                className={styles.formInput}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors[index]?.country && <span className={styles.error}>{errors[index].country}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={address.isDefaultShipping}
                    onChange={(e) => handleAddressChange(index, "isDefaultShipping", e.target.checked)}
                    disabled={isUpdating}
                    className={styles.checkboxInput}
                  />
                  Default Shipping
                </label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={address.isDefaultBilling}
                    onChange={(e) => handleAddressChange(index, "isDefaultBilling", e.target.checked)}
                    disabled={isUpdating}
                    className={styles.checkboxInput}
                  />
                  Default Billing
                </label>
              </div>
            </div>
          </div>
        ))}

        <button type="button" className={styles.addButton} onClick={handleAddAddress} disabled={isUpdating}>
          Add New Address
        </button>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isUpdating}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Addresses"}
        </button>
      </div>
    </form>
  );
};
