import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./loginPage.css";
import { loginUser, getOrCreateCustomerCart, mergeAnonymousCartToCustomerCart } from "../../utils/api";
import { validationMessages } from "./validationMessages";

interface ValidationErrors {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();
  const { setIsLoggedIn, isLoggedIn, setCustomer, setTokens } = useAuth();
  const { setCart } = useCart();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/main", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const validateEmail = (value: string): string => {
    if (!value) return validationMessages.email.required;
    if (value.includes(" ")) return validationMessages.email.noSpaces;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return validationMessages.email.invalidFormat;
    return "";
  };

  const validatePassword = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return validationMessages.password.required;
    if (trimmed !== value) return validationMessages.password.noWhitespace;
    if (trimmed.length < 8) return validationMessages.password.minLength;
    if (!/[A-Z]/.test(trimmed)) return validationMessages.password.uppercase;
    if (!/[a-z]/.test(trimmed)) return validationMessages.password.lowercase;
    if (!/[0-9]/.test(trimmed)) return validationMessages.password.digit;
    return "";
  };

  useEffect(() => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    setIsFormValid(!!email && !!password && !emailError && !passwordError);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      try {
        const { customer, accessToken, refreshToken } = await loginUser(email, password);
        if (!accessToken) {
          throw new Error("Authentication failed");
        }

        localStorage.setItem("access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }

        setTokens(accessToken, refreshToken || "");
        setIsLoggedIn(true);
        setCustomer(customer);

        const anonymousCartId = localStorage.getItem("anonymousCartId");
        let cart = await getOrCreateCustomerCart(accessToken, anonymousCartId || undefined);

        if (anonymousCartId) {
          cart = await mergeAnonymousCartToCustomerCart(anonymousCartId, cart.id, accessToken);
          localStorage.removeItem("anonymousCartId");
        }

        localStorage.setItem("cartId", cart.id);
        setCart(cart);

        navigate("/main");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        if (
          errorMessage.includes("invalid_client") ||
          errorMessage.includes("Customer credentials are invalid") ||
          errorMessage.includes("InvalidCredentials")
        ) {
          setServerError("Invalid email or password");
        } else {
          setServerError("An error occurred. Try again later.");
        }
        console.error("Login or cart error:", errorMessage);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="form-wrapper">
        <div className="form-container">
          <h2>Login</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setEmail(newValue);
                  setErrors((prev) => ({
                    ...prev,
                    email: validateEmail(newValue),
                  }));
                  setServerError("");
                }}
                className={errors.email ? "input-error" : ""}
                placeholder="user@example.com"
              />
              {errors.email && (
                <span className="error-field api-error">
                  <span className="error-icon">⚠</span> {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                  setServerError("");
                }}
                className={errors.password ? "input-error" : ""}
                placeholder="Enter your password"
              />
              {errors.password && (
                <span className="error-field api-error">
                  <span className="error-icon">⚠</span> {errors.password}
                </span>
              )}
            </div>

            {serverError && (
              <span className="error-field api-error server-error">
                <span className="error-icon">⚠</span> {serverError}
              </span>
            )}

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword">Show Password</label>
            </div>

            <button type="submit" disabled={!isFormValid} className={`submit-button ${isFormValid ? "" : "disabled"}`}>
              Login
            </button>

            <div className="register-link">
              <span>Don't have an account yet? </span>
              <NavLink to="/register">Sign up now</NavLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
