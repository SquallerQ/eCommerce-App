export const validationMessages = {
  email: {
    required: "Email is required",
    noSpaces: "Email must not contain spaces",
    invalidFormat: "Email must be properly formatted (e.g., user@example.com)",
  },
  password: {
    required: "Password is required",
    noWhitespace: "Password must not contain leading or trailing whitespace",
    minLength: "Password must be at least 8 characters long",
    uppercase: "Password must contain at least one uppercase letter",
    lowercase: "Password must contain at least one lowercase letter",
    digit: "Password must contain at least one digit",
  },
};
