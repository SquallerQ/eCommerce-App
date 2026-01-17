import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import styles from "./Profile.module.css";
import { useCookieManager } from "../../hooks/useCookieManager";
import { getCurrentCustomer, updateCustomer, updatePassword } from "../../utils/sdkManage";
import { Customer, MyCustomerUpdateAction } from "@commercetools/platform-sdk";
import { EditProfileForm } from "./profileComponents/editProfileForm";
import { EditAddressForm } from "./profileComponents/editAdresses";
import { ChangePasswordForm } from "./profileComponents/changePassword";
import { loginUser } from "../../utils/api";

const useCustomer = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cookies, setCookie } = useCookieManager();

  const fetchCustomer = async (token: string = cookies.access_token) => {
    setIsLoading(true);
    if (!token) {
      setError("Please log in.");
      setIsLoading(false);
      window.location.href = "/login";
      return;
    }
    try {
      const customerData = await getCurrentCustomer(token);
      setCustomer(customerData);
      setError(null);
    } catch (err) {
      const errorMessage =
        err?.body?.statusCode === 401 ? "Session expired. Please log in again." : "Failed to load user data.";
      setError(errorMessage);
      if (err?.body?.statusCode === 401) {
        setCookie("access_token", "");
        window.location.href = "/login";
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [cookies.access_token]);

  return { customer, isLoading, error, refreshCustomer: fetchCustomer, setCookie };
};

export const ProfilePage = () => {
  const { customer, isLoading, error, refreshCustomer, setCookie } = useCustomer();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { cookies } = useCookieManager();
  const [isEditingAddresses, setIsEditingAddresses] = useState(false);

  const handleSave = async (actions: MyCustomerUpdateAction[]) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await updateCustomer(cookies.access_token, {
        version: customer!.version,
        actions,
      });
      if (typeof response === "string") throw new Error(response);
      await refreshCustomer();
      setIsEditing(false);
    } catch (err) {
      setUpdateError(
        err?.body?.statusCode === 401 ? "Session expired. Please log in again." : "Failed to update profile."
      );
      if (err?.body?.statusCode === 401) window.location.href = "/login";
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const passwordResult = await updatePassword(cookies.access_token, currentPassword, newPassword);
      if (passwordResult.error) {
        throw new Error(
          passwordResult.error.includes("Invalid current password") ? "Invalid current password." : passwordResult.error
        );
      }

      const loginResponse = await loginUser(customer!.email, newPassword);
      setCookie("access_token", loginResponse.accessToken, { maxAge: 3600 });
      if (loginResponse.refreshToken) {
        setCookie("refresh_token", loginResponse.refreshToken, { maxAge: 30 * 86400 });
      }

      await refreshCustomer(loginResponse.accessToken);
      setIsEditingPassword(false);
    } catch (err) {
      if (err?.body?.statusCode === 401) {
        try {
          const loginResponse = await loginUser(customer!.email, newPassword);
          setCookie("access_token", loginResponse.accessToken, { maxAge: 3600 });
          if (loginResponse.refreshToken) {
            setCookie("refresh_token", loginResponse.refreshToken, { maxAge: 30 * 86400 });
          }
          await refreshCustomer(loginResponse.accessToken);
          setIsEditingPassword(false);
        } catch {
          setUpdateError("Session expired. Please log in again.");
          setCookie("access_token", "");
          window.location.href = "/login";
        }
      } else {
        setUpdateError(err.message || "Failed to change password.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (error || !customer) return <div className={styles.error}>{error || "Please log in."}</div>;

  return (
    <div className={styles.profileContainer}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            borderRadius: "8px",
            padding: "12px",
          },
          success: {
            style: {
              background: "#4caf50",
              color: "#fff",
            },
          },
          error: {
            style: {
              background: "#f44336",
              color: "#fff",
            },
          },
        }}
      />
      <h1 className={styles.profileHeader}>
        Welcome, {customer.firstName} {customer.lastName} !
      </h1>

      {updateError && <div className={styles.error}>{updateError}</div>}

      {isEditing ? (
        <EditProfileForm
          customer={customer}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isUpdating={isUpdating}
        />
      ) : isEditingPassword ? (
        <div className={styles.infoCard}>
          <ChangePasswordForm
            accessToken={cookies.access_token}
            onCancel={() => setIsEditingPassword(false)}
            onSuccess={handlePasswordChange}
            isUpdating={isUpdating}
          />
        </div>
      ) : (
        <>
          <div className={styles.infoCard}>
            <div className={styles.sectionHeaderContainer}>
              <h2 className={styles.sectionHeader}>Personal Info</h2>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>First Name:</span>
                <span className={styles.value}>{customer.firstName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Last Name:</span>
                <span className={styles.value}>{customer.lastName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email:</span>
                <span className={styles.value}>{customer.email}</span>
              </div>
              {customer.dateOfBirth && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Date of Birth:</span>
                  <span className={styles.value}>{new Date(customer.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              <button className={styles.editButton} onClick={() => setIsEditing(true)} disabled={isUpdating}>
                Edit Profile
              </button>
              <button className={styles.editButton} onClick={() => setIsEditingPassword(true)} disabled={isUpdating}>
                Change Password
              </button>
            </div>
          </div>

          {customer.addresses?.length > 0 && (
            <div className={styles.infoCard}>
              <div className={styles.sectionHeaderContainer}>
                <h2 className={styles.sectionHeader}>Addresses</h2>
                <button className={styles.editButton} onClick={() => setIsEditingAddresses(true)} disabled={isUpdating}>
                  Edit Addresses
                </button>
              </div>

              {isEditingAddresses ? (
                <EditAddressForm
                  customer={customer}
                  onSave={async (actions) => {
                    await handleSave(actions);
                    setIsEditingAddresses(false);
                  }}
                  onCancel={() => setIsEditingAddresses(false)}
                  isUpdating={isUpdating}
                />
              ) : (
                <div className={styles.addresses}>
                  {customer.addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`${styles.addressCard} ${
                        address.id === customer.defaultShippingAddressId ||
                        address.id === customer.defaultBillingAddressId
                          ? styles.defaultAddress
                          : ""
                      }`}
                    >
                      <div className={styles.addressHeader}>
                        <h3 className={styles.addressTitle}>
                          {address.id === customer.defaultShippingAddressId && "Shipping Address"}
                          {address.id === customer.defaultBillingAddressId && "Billing Address"}
                          {!customer.defaultShippingAddressId && !customer.defaultBillingAddressId && "Address"}
                        </h3>
                        {(address.id === customer.defaultShippingAddressId ||
                          address.id === customer.defaultBillingAddressId) && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                      </div>
                      <div className={styles.addressDetails}>
                        {address.streetName && <p>{address.streetName}</p>}
                        <p>{[address.city, address.postalCode].filter(Boolean).join(", ")}</p>
                        {address.country && <p>{address.country}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
