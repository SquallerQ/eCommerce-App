import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { getAccessTokenByRefresh } from "../api/getAccessTokenByRefresh";
import { useCookieManager } from "../hooks/useCookieManager";
import { Customer } from "@commercetools/platform-sdk";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import { createExistingTokenClient } from "../utils/BuildClient";
import { projectKey } from "../utils/api";

interface AuthContextType {
  isLoggedIn: boolean;
  customer: Customer | null;
  accessToken: string | null;
  setIsLoggedIn: (value: boolean) => void;
  setCustomer: (customer: Customer | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { cookies, setCookie, removeCookie } = useCookieManager();
  const [isLoggedIn, setIsLoggedIn] = useState(lslogin);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const isInitializingRef = useRef(false);

  function lslogin() {
    const authLs = localStorage.getItem("auth");
    return authLs === "true";
  }

  const setTokens = (newAccessToken: string | null, newRefreshToken: string | null) => {
    setAccessToken(newAccessToken);
    if (newAccessToken) {
      setCookie("access_token", newAccessToken, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    } else {
      removeCookie("access_token");
    }
    if (newRefreshToken) {
      setCookie("refresh_token", newRefreshToken, { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    } else {
      removeCookie("refresh_token");
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isInitializingRef.current) return;

      isInitializingRef.current = true;

      try {
        const accessTokenCookie = cookies.access_token;
        const refreshToken = cookies.refresh;

        const accessTokenExists = accessTokenCookie && !["", "null", "undefined"].includes(accessTokenCookie);
        const refreshTokenExists = refreshToken && !["", "null", "undefined"].includes(refreshToken);

        let newAccessToken = null;

        if (accessTokenExists) {
          newAccessToken = accessTokenCookie;
        } else if (refreshTokenExists) {
          const result = await getAccessTokenByRefresh(refreshToken);
          if (result.ok) {
            const data = await result.json();
            setCookie("scope", data.scope);
            setCookie("token_type", data.token_type);
            newAccessToken = data.access_token;
            setTokens(data.access_token, refreshToken);
          } else {
            setTokens(null, null);
            removeCookie("scope");
            removeCookie("token_type");
            setIsLoggedIn(false);
            setCustomer(null);
            return;
          }
        }

        if (newAccessToken) {
          setAccessToken(newAccessToken);
          setIsLoggedIn(true);

          const customerClient = createExistingTokenClient(newAccessToken);
          const apiRootCustomer = createApiBuilderFromCtpClient(customerClient).withProjectKey({ projectKey });

          const customer = await apiRootCustomer
            .me()
            .get()
            .execute()
            .then((res) => res.body);
          setCustomer(customer);
        }
      } catch (error) {
        console.error("AuthContext.tsx: Error initializing auth:", error);
        setTokens(null, null);
        removeCookie("scope");
        removeCookie("token_type");
        setIsLoggedIn(false);
        setCustomer(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("cartId");
      } finally {
        isInitializingRef.current = false;
      }
    };

    initAuth();
  }, [cookies.access_token, cookies.refresh_token, setCookie, removeCookie]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, customer, accessToken, setIsLoggedIn, setCustomer, setTokens }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
