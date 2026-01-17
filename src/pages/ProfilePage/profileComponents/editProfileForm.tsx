import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./Profile.module.css";
import { Customer, MyCustomerUpdateAction } from "@commercetools/platform-sdk";

interface EditProfileFormProps {
  customer: Customer;
  onSave: (actions: MyCustomerUpdateAction[]) => Promise<void>;
  onCancel: () => void;
  isUpdating?: boolean;
}

export const EditProfileForm = ({ customer, onSave, onCancel, isUpdating = false }: EditProfileFormProps) => {
  const [formData, setFormData] = useState({
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    email: customer.email || "",
    dateOfBirth: customer.dateOfBirth || "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateName = (name: string, field: string): string | null => {
    if (!name) return `${field} is required`;
    const nameRegex = /^[A-Z][a-z]*$/;
    return nameRegex.test(name) ? null : `${field} must start with a capital letter and contain only letters`;
  };

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : "Invalid email format";
  };

  const validateDateOfBirth = (date: string): string | null => {
    if (!date) return null;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return "Invalid date";
    if (parsedDate >= new Date()) return "Date of birth must be in the past";
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    const firstNameError = validateName(formData.firstName, "First name");
    const lastNameError = validateName(formData.lastName, "Last name");
    const emailError = validateEmail(formData.email);
    const dateError = validateDateOfBirth(formData.dateOfBirth);

    if (firstNameError) newErrors.firstName = firstNameError;
    if (lastNameError) newErrors.lastName = lastNameError;
    if (emailError) newErrors.email = emailError;
    if (dateError) newErrors.dateOfBirth = dateError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const actions: MyCustomerUpdateAction[] = [];

    if (formData.firstName !== customer.firstName) {
      actions.push({ action: "setFirstName", firstName: formData.firstName });
    }
    if (formData.lastName !== customer.lastName) {
      actions.push({ action: "setLastName", lastName: formData.lastName });
    }
    if (formData.email !== customer.email) {
      actions.push({ action: "changeEmail", email: formData.email });
    }
    if (formData.dateOfBirth && formData.dateOfBirth !== customer.dateOfBirth) {
      actions.push({ action: "setDateOfBirth", dateOfBirth: formData.dateOfBirth });
    }

    try {
      await onSave(actions);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <div className={styles.formSection}>
        <h2 className={styles.sectionHeader}>Personal Information</h2>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            disabled={isUpdating}
            className={styles.formInput}
          />
          {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            disabled={isUpdating}
            className={styles.formInput}
          />
          {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isUpdating}
            className={styles.formInput}
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            disabled={isUpdating}
            className={styles.formInput}
          />
          {errors.dateOfBirth && <span className={styles.error}>{errors.dateOfBirth}</span>}
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isUpdating}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
