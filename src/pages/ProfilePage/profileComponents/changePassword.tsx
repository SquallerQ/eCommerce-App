import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./Profile.module.css";

interface ChangePasswordFormProps {
  accessToken: string;
  onCancel: () => void;
  onSuccess: (currentPassword: string, newPassword: string) => Promise<void>;
  isUpdating?: boolean;
}

export const ChangePasswordForm = ({ onCancel, onSuccess, isUpdating = false }: ChangePasswordFormProps) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validatePassword = (currentPassword: string, newPassword: string, confirmPassword: string): string | null => {
    if (!currentPassword) return "Current password is required";
    if (!newPassword) return "New password is required";
    if (newPassword.length < 8) return "New password must be at least 8 characters long";
    if (!/\d/.test(newPassword)) return "New password must contain at least one digit";
    if (!/[A-Z]/.test(newPassword)) return "New password must contain at least one uppercase letter";
    if (newPassword !== confirmPassword) return "New password and confirmation do not match";
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(formData.currentPassword, formData.newPassword, formData.confirmPassword);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    setErrors({});

    try {
      await onSuccess(formData.currentPassword, formData.newPassword);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully!");
    } catch (error) {
      const errorMessage =
        error?.message === "Invalid current password"
          ? "Invalid current password"
          : "Failed to change password. Please try again.";
      setErrors({ password: errorMessage });
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <div className={styles.formSection}>
        <h2 className={styles.sectionHeader}>Change Password</h2>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            required
            disabled={isUpdating}
            className={styles.formInput}
          />
          {errors.password && <span className={styles.error}>{errors.password}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            required
            disabled={isUpdating}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            disabled={isUpdating}
            className={styles.formInput}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isUpdating}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Change Password"}
        </button>
      </div>
    </form>
  );
};
